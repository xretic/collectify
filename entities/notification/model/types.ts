import type { UserPreview } from '@/entities/user/model/types';

export type NotificationType =
    | 'FOLLOW'
    | 'LIKE'
    | 'COMMENT'
    | 'FAVORITE'
    | 'REPORT_RESOLVED'
    | 'SANCTION';

export type AppNotification = {
    id: number;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    sender: UserPreview | null;
    collection: { id: number; name: string } | null;
};

export type NotificationsPage = {
    data: AppNotification[];
    unread: number;
    nextCursor: number | null;
};

export const NOTIFICATION_TEXTS: Record<NotificationType, string> = {
    FOLLOW: 'started following you',
    LIKE: 'liked your collection',
    FAVORITE: 'added your collection to favorites',
    COMMENT: 'commented on your collection',
    REPORT_RESOLVED: 'Your report has been reviewed. Thank you for helping keep Collectify safe.',
    SANCTION: 'A moderator restricted your account. Check your settings for details.',
};
