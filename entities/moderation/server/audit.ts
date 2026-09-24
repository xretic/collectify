import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db, type Tx } from '@/shared/server/db';

/**
 * Who performed a moderation action: the account used (`userId`) and, when an
 * admin was impersonating that account, the admin (`impersonatorId`).
 */
export type ModerationActor = {
    userId: number;
    impersonatorId: number | null;
};

export type AuditEntry = {
    action: string;
    reason?: string;
    targetUserId?: number | null;
    targetCollectionId?: number | null;
    targetCommentId?: number | null;
    targetMessageId?: number | null;
    metadata?: Prisma.InputJsonValue;
};

export async function writeAudit(actor: ModerationActor, entry: AuditEntry, client: Tx = db) {
    await client.moderationAction.create({
        data: {
            actorId: actor.userId,
            impersonatorId: actor.impersonatorId,
            action: entry.action,
            reason: entry.reason ?? '',
            targetUserId: entry.targetUserId ?? null,
            targetCollectionId: entry.targetCollectionId ?? null,
            targetCommentId: entry.targetCommentId ?? null,
            targetMessageId: entry.targetMessageId ?? null,
            metadata: entry.metadata,
        },
    });
}
