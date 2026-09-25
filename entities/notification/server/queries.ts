import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { NOTIFICATIONS_PAGE_SIZE } from '@/shared/lib/constants';
import type { AppNotification, NotificationsPage } from '../model/types';

export const notificationSelect = {
    id: true,
    type: true,
    isRead: true,
    createdAt: true,
    recipientUserId: true,
    senderUser: { select: { id: true, username: true, avatarUrl: true } },
    collection: { select: { id: true, name: true, bannerUrl: true } },
    comment: { select: { id: true, text: true } },
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

export function toAppNotification(row: NotificationRow): AppNotification {
    return {
        id: row.id,
        type: row.type,
        isRead: row.isRead,
        createdAt: row.createdAt.toISOString(),
        sender: row.senderUser,
        collection: row.collection,
        comment: row.comment,
    };
}

export function countUnread(userId: number) {
    return db.notification.count({
        where: { recipientUserId: userId, isRead: false, retractedAt: null },
    });
}

export async function listNotifications(
    userId: number,
    { onlyUnread, cursor }: { onlyUnread: boolean; cursor: number | null },
): Promise<NotificationsPage> {
    const [rows, unread] = await Promise.all([
        db.notification.findMany({
            where: {
                recipientUserId: userId,
                retractedAt: null,
                ...(onlyUnread ? { isRead: false } : {}),
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            orderBy: { id: 'desc' },
            take: NOTIFICATIONS_PAGE_SIZE + 1,
            select: notificationSelect,
        }),
        countUnread(userId),
    ]);

    const page = rows.slice(0, NOTIFICATIONS_PAGE_SIZE);

    return {
        unread,
        nextCursor: rows.length > NOTIFICATIONS_PAGE_SIZE ? page[page.length - 1].id : null,
        data: page.map(toAppNotification),
    };
}

export async function markAllNotificationsRead(userId: number) {
    await db.notification.updateMany({
        where: { recipientUserId: userId, isRead: false },
        data: { isRead: true },
    });
}

/** Marks one of the user's notifications as read; returns the new unread count. */
export async function markNotificationRead(userId: number, notificationId: number) {
    await db.notification.updateMany({
        where: { id: notificationId, recipientUserId: userId, isRead: false },
        data: { isRead: true },
    });

    return countUnread(userId);
}
