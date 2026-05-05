import { api } from '@/shared/api/api';
import { NotificationsResponse } from '@/entities/notification/model/types';

export const notificationApi = {
    list(onlyUnread: boolean) {
        return api
            .get('api/notifications', {
                searchParams: { onlyUnread: String(onlyUnread) },
            })
            .json<NotificationsResponse>();
    },

    markAllAsRead() {
        return api.patch('api/notifications').json<NotificationsResponse>();
    },
};
