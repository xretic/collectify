import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { badRequest, conflict, forbidden, notFound } from '@/shared/server/http';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { assertCanModerate, type StaffContext } from '@/features/auth/server/guards';
import { issueSanction } from '@/entities/sanction/server/sanctions';
import { expiresAtFromDuration } from '@/entities/sanction/model/types';
import { writeAudit } from '@/entities/moderation/server/audit';
import { deliverNotifications, notifySystem } from '@/entities/notification/server/notifications';
import { COLLECTIONS_CACHE_NAMESPACE } from '@/entities/collection/server/queries';
import type { ReviewReportPayload } from '@/entities/report/model/types';

class ReportAlreadyReviewed extends Error {}

/**
 * Closes a report. Everything happens in one transaction:
 *  - the OPEN -> CLOSED transition is atomic, so two moderators can never
 *    both punish for the same report;
 *  - sanctions never weaken an existing, stronger one;
 *  - other open reports about the same content are closed with it;
 *  - the audit record and notifications commit together with the decision.
 */
export async function reviewReport(
    ctx: StaffContext,
    reportId: number,
    payload: ReviewReportPayload,
) {
    const report = await db.report.findUnique({
        where: { id: reportId },
        select: {
            id: true,
            status: true,
            reporterId: true,
            targetUserId: true,
            targetType: true,
            reason: true,
            commentId: true,
            collectionId: true,
        },
    });

    if (!report) throw notFound('Report not found.');
    if (report.status === 'CLOSED') throw conflict('Report is already closed.');
    if (report.reporterId === ctx.userId && !ctx.isAdmin) {
        throw forbidden('You cannot review your own report.');
    }

    await assertCanModerate(ctx, report.targetUserId);

    const expiresAt = payload.punishment
        ? expiresAtFromDuration(payload.punishment.duration)
        : null;

    if (payload.punishment && expiresAt === null && !ctx.isAdmin) {
        throw forbidden('Only admins can issue permanent sanctions.');
    }

    if (payload.removeContent && report.targetType === 'USER') {
        throw badRequest('There is no content to remove for a user report.');
    }

    if (payload.duplicateOfId !== null) {
        const original = await db.report.findUnique({
            where: { id: payload.duplicateOfId },
            select: { id: true, targetUserId: true },
        });

        if (
            !original ||
            original.id === report.id ||
            original.targetUserId !== report.targetUserId
        ) {
            throw badRequest('The original report must be another report about the same user.');
        }
    }

    const contentFilter: Prisma.ReportWhereInput = {
        targetType: report.targetType,
        commentId: report.commentId,
        collectionId: report.collectionId,
        ...(report.targetType === 'USER' ? { targetUserId: report.targetUserId } : {}),
    };

    let sanctionApplied = false;

    const notificationIds: number[] = [];

    try {
        await db.$transaction(async (tx) => {
            const now = new Date();

            const closed = await tx.report.updateMany({
                where: { id: report.id, status: 'OPEN' },
                data: {
                    status: 'CLOSED',
                    openKey: null,
                    verdict: payload.verdict,
                    resolution: payload.resolution,
                    reviewedById: ctx.userId,
                    reviewedAt: now,
                    duplicateOfId: payload.duplicateOfId,
                },
            });

            if (closed.count === 0) throw new ReportAlreadyReviewed();

            let sanctionId: number | null = null;

            if (payload.punishment) {
                const result = await issueSanction(tx, {
                    userId: report.targetUserId,
                    moderatorId: ctx.userId,
                    scope: payload.punishment.scope,
                    expiresAt,
                    reason: payload.resolution || `Report #${report.id}: ${report.reason}`,
                });

                sanctionId = result.sanctionId;
                sanctionApplied = result.applied;

                await tx.report.update({ where: { id: report.id }, data: { sanctionId } });
            }

            let closedTogether = 0;

            if (payload.verdict === 'GUILTY') {
                const others = await tx.report.updateMany({
                    where: { ...contentFilter, status: 'OPEN', id: { not: report.id } },
                    data: {
                        status: 'CLOSED',
                        openKey: null,
                        verdict: 'GUILTY',
                        resolution: `Resolved together with report #${report.id}.`,
                        reviewedById: ctx.userId,
                        reviewedAt: now,
                        duplicateOfId: report.id,
                        sanctionId,
                    },
                });
                closedTogether = others.count;
            }

            if (payload.removeContent) {
                if (report.commentId)
                    await tx.comment.deleteMany({ where: { id: report.commentId } });
                if (report.collectionId) {
                    await tx.collection.deleteMany({ where: { id: report.collectionId } });
                }
            }

            await writeAudit(
                ctx.actor,
                {
                    action: `report:${payload.verdict}`,
                    reason: payload.resolution,
                    targetUserId: report.targetUserId,
                    targetCollectionId: payload.removeContent ? null : report.collectionId,
                    targetCommentId: payload.removeContent ? null : report.commentId,
                    metadata: {
                        reportId: report.id,
                        targetType: report.targetType,
                        removedContent: payload.removeContent,
                        punishment: payload.punishment,
                        sanctionId,
                        sanctionApplied,
                        closedTogether,
                        duplicateOfId: payload.duplicateOfId,
                    },
                },
                tx,
            );

            notificationIds.push(await notifySystem(report.reporterId, 'REPORT_RESOLVED', tx));
            if (sanctionApplied) {
                notificationIds.push(await notifySystem(report.targetUserId, 'SANCTION', tx));
            }
        });
    } catch (error) {
        if (error instanceof ReportAlreadyReviewed) {
            throw conflict('This report was just reviewed by someone else.');
        }
        throw error;
    }

    await deliverNotifications(notificationIds);

    if (payload.removeContent) {
        if (report.collectionId || report.commentId) {
            await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
        }
    }

    return { sanctionApplied };
}
