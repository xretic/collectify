import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { notFound } from '@/shared/server/http';
import { getActiveSanctions } from '@/entities/sanction/server/sanctions';
import type { ActiveSanction } from '@/entities/sanction/model/types';
import { nonStaffUserFilter } from '@/entities/user/server/roles';
import type {
    ReportDetails,
    ReportListItem,
    ReportReason,
    ReportSnapshot,
    ReportsPage,
    ReportStatus,
    ReportTargetType,
} from '../model/types';

const REPORTS_PAGE_SIZE = 20;

const userPreview = { select: { id: true, username: true, avatarUrl: true } } as const;

const listSelect = {
    id: true,
    targetType: true,
    reason: true,
    status: true,
    verdict: true,
    createdAt: true,
    reporter: userPreview,
    targetUser: userPreview,
} satisfies Prisma.ReportSelect;

type ListRow = Prisma.ReportGetPayload<{ select: typeof listSelect }>;

function toListItem(row: ListRow): ReportListItem {
    return { ...row, createdAt: row.createdAt.toISOString() };
}

function toActiveSanction(sanction: {
    id: number;
    scope: ActiveSanction['scope'];
    reason: string;
    expiresAt: Date | null;
    createdAt: Date;
}): ActiveSanction {
    return {
        id: sanction.id,
        scope: sanction.scope,
        reason: sanction.reason,
        expiresAt: sanction.expiresAt?.toISOString() ?? null,
        createdAt: sanction.createdAt.toISOString(),
    };
}

export type ReportViewer = { userId: number; isAdmin: boolean };

/**
 * Which reports a staff member may see: admins see every report, including
 * their own; moderators never see their own reports or reports about
 * themselves, and only see reports about regular users.
 */
export function visibleReportsFilter(viewer: ReportViewer): Prisma.ReportWhereInput {
    if (viewer.isAdmin) return {};

    return {
        reporterId: { not: viewer.userId },
        targetUserId: { not: viewer.userId },
        targetUser: nonStaffUserFilter,
    };
}

export async function listReports(
    viewer: ReportViewer,
    filters: {
        status: ReportStatus;
        targetType?: ReportTargetType;
        reason?: ReportReason;
        cursor: number | null;
    },
): Promise<ReportsPage> {
    const where: Prisma.ReportWhereInput = {
        ...visibleReportsFilter(viewer),
        status: filters.status,
        ...(filters.targetType ? { targetType: filters.targetType } : {}),
        ...(filters.reason ? { reason: filters.reason } : {}),
    };

    // Open reports are a FIFO queue (oldest first); closed ones are history (newest first).
    const oldestFirst = filters.status === 'OPEN';
    const cursorFilter = filters.cursor
        ? { id: oldestFirst ? { gt: filters.cursor } : { lt: filters.cursor } }
        : {};

    const [rows, total] = await Promise.all([
        db.report.findMany({
            where: { ...where, ...cursorFilter },
            orderBy: { id: oldestFirst ? 'asc' : 'desc' },
            take: REPORTS_PAGE_SIZE + 1,
            select: listSelect,
        }),
        db.report.count({ where }),
    ]);

    const page = rows.slice(0, REPORTS_PAGE_SIZE);

    return {
        data: page.map(toListItem),
        total,
        nextCursor: rows.length > REPORTS_PAGE_SIZE ? page[page.length - 1].id : null,
    };
}

export async function getReportDetails(
    viewer: ReportViewer,
    reportId: number,
): Promise<ReportDetails> {
    const report = await db.report.findFirst({
        where: { id: reportId, ...visibleReportsFilter(viewer) },
        select: {
            ...listSelect,
            details: true,
            resolution: true,
            reviewedAt: true,
            reviewedBy: userPreview,
            duplicateOfId: true,
            contentSnapshot: true,
            targetUserId: true,
            reporterId: true,
            commentId: true,
            collectionId: true,
            comment: { select: { id: true, collectionId: true } },
            collection: { select: { id: true } },
            sanction: {
                select: { id: true, scope: true, reason: true, expiresAt: true, createdAt: true },
            },
        },
    });

    if (!report) throw notFound('Report not found.');

    const [targetSanctions, targetReports, targetGuiltyReports, reporterReports, reporterRejected] =
        await Promise.all([
            getActiveSanctions([report.targetUserId]),
            db.report.count({ where: { targetUserId: report.targetUserId } }),
            db.report.count({ where: { targetUserId: report.targetUserId, verdict: 'GUILTY' } }),
            db.report.count({ where: { reporterId: report.reporterId } }),
            db.report.count({
                where: {
                    reporterId: report.reporterId,
                    verdict: { in: ['NO_VIOLATION', 'INSUFFICIENT_EVIDENCE'] },
                },
            }),
        ]);

    const contentLink =
        report.targetType === 'USER'
            ? `/users/${report.targetUserId}`
            : report.collection
              ? `/collections/${report.collection.id}`
              : report.comment
                ? `/collections/${report.comment.collectionId}`
                : null;

    const contentExists =
        report.targetType === 'USER' || Boolean(report.comment ?? report.collection);

    return {
        ...toListItem(report),
        details: report.details,
        resolution: report.resolution,
        reviewedAt: report.reviewedAt?.toISOString() ?? null,
        reviewedBy: report.reviewedBy,
        duplicateOfId: report.duplicateOfId,
        snapshot: (report.contentSnapshot as ReportSnapshot | null) ?? null,
        contentExists,
        contentLink,
        sanction: report.sanction ? toActiveSanction(report.sanction) : null,
        context: {
            targetActiveSanctions: targetSanctions.map(toActiveSanction),
            targetReports,
            targetGuiltyReports,
            reporterReports,
            reporterRejectedReports: reporterRejected,
        },
    };
}
