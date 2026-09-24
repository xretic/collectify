import 'server-only';
import { db, type Tx } from '@/shared/server/db';
import type { NotificationType } from '../model/types';

type SocialType = Extract<NotificationType, 'FOLLOW' | 'LIKE' | 'FAVORITE'>;

type SocialNotification = {
    type: SocialType;
    senderUserId: number;
    recipientUserId: number;
    collectionId?: number;
};

/**
 * Follow/like/favorite: one notification per (sender, recipient, type,
 * collection). Repeating the action refreshes it instead of duplicating.
 */
export async function notifySocial(input: SocialNotification, client: Tx = db) {
    if (input.senderUserId === input.recipientUserId) return;

    const where = {
        type: input.type,
        senderUserId: input.senderUserId,
        recipientUserId: input.recipientUserId,
        collectionId: input.collectionId ?? null,
    };

    const existing = await client.notification.findFirst({ where, select: { id: true } });

    if (existing) {
        await client.notification.update({
            where: { id: existing.id },
            data: { isRead: false, createdAt: new Date() },
        });
        return;
    }

    await client.notification.create({ data: where });
}

/** Undo of follow/like/favorite removes the matching notification. */
export async function retractSocial(input: SocialNotification, client: Tx = db) {
    await client.notification.deleteMany({
        where: {
            type: input.type,
            senderUserId: input.senderUserId,
            recipientUserId: input.recipientUserId,
            collectionId: input.collectionId ?? null,
        },
    });
}

export async function notifyComment(
    input: { senderUserId: number; recipientUserId: number; collectionId: number },
    client: Tx = db,
) {
    if (input.senderUserId === input.recipientUserId) return;
    await client.notification.create({ data: { type: 'COMMENT', ...input } });
}

/** System notification (no sender), e.g. report outcome or sanction. */
export async function notifySystem(
    recipientUserId: number,
    type: Extract<NotificationType, 'REPORT_RESOLVED' | 'SANCTION'>,
    client: Tx = db,
) {
    await client.notification.create({ data: { type, recipientUserId } });
}
