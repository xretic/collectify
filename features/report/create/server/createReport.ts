import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db, isUniqueViolation } from '@/shared/server/db';
import { conflict, forbidden, notFound } from '@/shared/server/http';
import { getUserRoles } from '@/entities/user/server/roles';
import {
    reportOpenKey,
    type CreateReportPayload,
    type ReportSnapshot,
    type ReportTarget,
} from '@/entities/report/model/types';

type ResolvedTarget = {
    targetUserId: number;
    targetId: number;
    snapshot: ReportSnapshot | null;
    relation: Pick<Prisma.ReportUncheckedCreateInput, 'messageId' | 'commentId' | 'collectionId'>;
};

/** Finds what is being reported, checks the reporter can see it and snapshots it. */
async function resolveTarget(target: ReportTarget, reporterId: number): Promise<ResolvedTarget> {
    switch (target.type) {
        case 'USER': {
            const user = await db.user.findUnique({
                where: { id: target.userId },
                select: { id: true },
            });
            if (!user) throw notFound('User not found.');

            return { targetUserId: user.id, targetId: user.id, snapshot: null, relation: {} };
        }

        case 'MESSAGE': {
            const message = await db.message.findUnique({
                where: { id: target.messageId },
                select: {
                    id: true,
                    userId: true,
                    chatId: true,
                    content: true,
                    createdAt: true,
                    chat: {
                        select: { users: { where: { id: reporterId }, select: { id: true } } },
                    },
                },
            });
            if (!message) throw notFound('Message not found.');
            if (message.chat.users.length === 0) throw forbidden();

            return {
                targetUserId: message.userId,
                targetId: message.id,
                snapshot: {
                    text: message.content,
                    chatId: message.chatId,
                    createdAt: message.createdAt.toISOString(),
                },
                relation: { messageId: message.id },
            };
        }

        case 'COMMENT': {
            const comment = await db.comment.findUnique({
                where: { id: target.commentId },
                select: {
                    id: true,
                    userId: true,
                    text: true,
                    createdAt: true,
                    collectionId: true,
                    collection: { select: { userId: true, private: true } },
                },
            });
            if (!comment) throw notFound('Comment not found.');
            if (comment.collection.private && comment.collection.userId !== reporterId) {
                throw notFound('Comment not found.');
            }

            return {
                targetUserId: comment.userId,
                targetId: comment.id,
                snapshot: {
                    text: comment.text,
                    collectionId: comment.collectionId,
                    createdAt: comment.createdAt.toISOString(),
                },
                relation: { commentId: comment.id },
            };
        }

        case 'COLLECTION': {
            const collection = await db.collection.findUnique({
                where: { id: target.collectionId },
                select: {
                    id: true,
                    userId: true,
                    private: true,
                    name: true,
                    description: true,
                    category: true,
                    createdAt: true,
                },
            });
            // Private collections are invisible to everyone but the owner,
            // and owners cannot report themselves.
            if (!collection || !collection.userId || collection.private) {
                throw notFound('Collection not found.');
            }

            return {
                targetUserId: collection.userId,
                targetId: collection.id,
                snapshot: {
                    name: collection.name,
                    description: collection.description,
                    category: collection.category,
                    createdAt: collection.createdAt.toISOString(),
                },
                relation: { collectionId: collection.id },
            };
        }
    }
}

export async function createReport(reporterId: number, payload: CreateReportPayload) {
    const target = await resolveTarget(payload.target, reporterId);

    if (target.targetUserId === reporterId) throw forbidden('You cannot report yourself.');

    const targetRoles = await getUserRoles(target.targetUserId);
    if (targetRoles.includes('Admin')) throw forbidden('This account cannot be reported.');

    try {
        await db.report.create({
            data: {
                reporterId,
                targetUserId: target.targetUserId,
                targetType: payload.target.type,
                ...target.relation,
                contentSnapshot: target.snapshot ?? undefined,
                reason: payload.reason,
                details: payload.details,
                openKey: reportOpenKey(reporterId, payload.target.type, target.targetId),
            },
            select: { id: true },
        });
    } catch (error) {
        if (isUniqueViolation(error)) {
            throw conflict('You have already reported this. Moderators will review it soon.');
        }
        throw error;
    }
}
