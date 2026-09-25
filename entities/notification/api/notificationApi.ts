import { api } from '@/shared/api/api';
import type { NotificationsPage } from '../model/types';

export const notificationApi = {
    list(onlyUnread: boolean, cursor: number | null) {
        return api
            .get('notifications', {
                searchParams: { onlyUnread: String(onlyUnread), ...(cursor ? { cursor } : {}) },
            })
            .json<NotificationsPage>();
    },

    async markAsRead(notificationId: number) {
        return (await api.patch(`notifications/${notificationId}/read`).json<{ unread: number }>())
            .unread;
    },

    async markAllAsRead() {
        await api.patch('notifications/read');
    },
};
