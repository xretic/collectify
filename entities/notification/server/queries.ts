import 'server-only';
import { db } from '@/shared/server/db';
import { NOTIFICATIONS_PAGE_SIZE } from '@/shared/lib/constants';
import type { NotificationsPage } from '../model/types';

export async function listNotifications(
    userId: number,
    { onlyUnread, cursor }: { onlyUnread: boolean; cursor: number | null },
): Promise<NotificationsPage> {
    const [rows, unread] = await Promise.all([
        db.notification.findMany({
            where: {
                recipientUserId: userId,
                ...(onlyUnread ? { isRead: false } : {}),
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            orderBy: { id: 'desc' },
            take: NOTIFICATIONS_PAGE_SIZE + 1,
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                senderUser: { select: { id: true, username: true, avatarUrl: true } },
                collection: { select: { id: true, name: true } },
            },
        }),
        db.notification.count({ where: { recipientUserId: userId, isRead: false } }),
    ]);

    const page = rows.slice(0, NOTIFICATIONS_PAGE_SIZE);

    return {
        unread,
        nextCursor: rows.length > NOTIFICATIONS_PAGE_SIZE ? page[page.length - 1].id : null,
        data: page.map((row) => ({
            id: row.id,
            type: row.type,
            isRead: row.isRead,
            createdAt: row.createdAt.toISOString(),
            sender: row.senderUser,
            collection: row.collection,
        })),
    };
}

export async function markAllNotificationsRead(userId: number) {
    await db.notification.updateMany({
        where: { recipientUserId: userId, isRead: false },
        data: { isRead: true },
    });
}
