import { NotificationInResponse } from '@/types/NotificationInResponse';

export type NotificationsResponse = {
    data: NotificationInResponse[];
    totalAmount: number;
    unreadAmount: number;
};
