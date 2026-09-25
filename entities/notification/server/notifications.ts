import 'server-only';
import { db, type Tx } from '@/shared/server/db';
import { publishToUsers } from '@/shared/server/realtime';
import type { NotificationType } from '../model/types';
import { countUnread, notificationSelect, toAppNotification } from './queries';

/*
 * Writing a notification and pushing it are separate steps: `notify*` store the
 * row (optionally inside the caller's transaction) and return its id, and
 * `deliverNotifications` pushes stored rows to online recipients. Callers that
 * use a transaction deliver after it commits, so nothing is pushed that could
 * still roll back.
 */

type SocialType = Extract<NotificationType, 'FOLLOW' | 'LIKE' | 'FAVORITE' | 'COMMENT_LIKED'>;

type SocialNotification = {
    type: SocialType;
    senderUserId: number;
    recipientUserId: number;
    collectionId?: number;
    commentId?: number;
};

function socialWhere(input: SocialNotification) {
    return {
        type: input.type,
        senderUserId: input.senderUserId,
        recipientUserId: input.recipientUserId,
        collectionId: input.collectionId ?? null,
        commentId: input.commentId ?? null,
    };
}

/**
 * Follow/like/favorite/comment heart: one notification per (sender, recipient,
 * type, target), ever. Repeating the action, or undoing and redoing it, never
 * notifies again: a retracted row is quietly restored as it was.
 * Returns the id only for a brand new notification that should be delivered.
 */
export async function notifySocial(
    input: SocialNotification,
    client: Tx = db,
): Promise<number | null> {
    if (input.senderUserId === input.recipientUserId) return null;

    const where = socialWhere(input);
    const existing = await client.notification.findFirst({
        where,
        select: { id: true, retractedAt: true },
    });

    if (existing) {
        if (existing.retractedAt) {
            await client.notification.update({
                where: { id: existing.id },
                data: { retractedAt: null },
            });
        }
        return null;
    }

    return (await client.notification.create({ data: where, select: { id: true } })).id;
}

/** Undo of follow/like/favorite hides the matching notification (and tells the client). */
export async function retractSocial(input: SocialNotification) {
    const where = { ...socialWhere(input), retractedAt: null };

    const rows = await db.notification.findMany({ where, select: { id: true } });
    if (rows.length === 0) return;

    await db.notification.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: { retractedAt: new Date() },
    });

    await publishToUsers([input.recipientUserId], 'notification:removed', {
        ids: rows.map((row) => row.id),
        unread: await countUnread(input.recipientUserId),
    });
}

export async function notifyComment(
    input: {
        type: Extract<NotificationType, 'COMMENT' | 'COMMENT_REPLY'>;
        senderUserId: number;
        recipientUserId: number;
        collectionId: number;
        commentId: number;
    },
    client: Tx = db,
): Promise<number | null> {
    if (input.senderUserId === input.recipientUserId) return null;

    return (
        await client.notification.create({
            data: input,
            select: { id: true },
        })
    ).id;
}

/** System notification (no sender), e.g. report outcome or sanction. */
export async function notifySystem(
    recipientUserId: number,
    type: Extract<NotificationType, 'REPORT_RESOLVED' | 'SANCTION'>,
    client: Tx = db,
): Promise<number> {
    return (
        await client.notification.create({ data: { type, recipientUserId }, select: { id: true } })
    ).id;
}

/** Pushes stored notifications to their recipients. Best effort, never throws. */
export async function deliverNotifications(ids: (number | null | undefined)[]) {
    const wanted = ids.filter((id): id is number => typeof id === 'number');
    if (wanted.length === 0) return;

    try {
        const rows = await db.notification.findMany({
            where: { id: { in: wanted }, retractedAt: null },
            select: notificationSelect,
        });

        await Promise.all(
            rows.map(async (row) =>
                publishToUsers([row.recipientUserId], 'notification:new', {
                    notification: toAppNotification(row),
                    unread: await countUnread(row.recipientUserId),
                }),
            ),
        );
    } catch (error) {
        console.error('[notifications] delivery failed:', error);
    }
}
