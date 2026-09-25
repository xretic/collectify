import type { UserPreview } from '@/entities/user/model/types';

export type NotificationType =
    | 'FOLLOW'
    | 'LIKE'
    | 'COMMENT'
    | 'FAVORITE'
    | 'REPORT_RESOLVED'
    | 'SANCTION'
    | 'COMMENT_REPLY'
    | 'COMMENT_LIKED';

export type AppNotification = {
    id: number;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    sender: UserPreview | null;
    collection: { id: number; name: string; bannerUrl: string } | null;
    comment: { id: number; text: string } | null;
};

export type NotificationsPage = {
    data: AppNotification[];
    unread: number;
    nextCursor: number | null;
};

declare module '@/shared/lib/realtime/events' {
    interface RealtimeEvents {
        /** A new (or refreshed) notification for the connected user. */
        'notification:new': { notification: AppNotification; unread: number };
        /** Notifications withdrawn (unlike, unfollow…) or read on another device. */
        'notification:removed': { ids: number[]; unread: number };
    }
}

export const NOTIFICATION_TEXTS: Record<NotificationType, string> = {
    FOLLOW: 'started following you',
    LIKE: 'liked your collection',
    FAVORITE: 'saved your collection',
    COMMENT: 'commented on your collection',
    REPORT_RESOLVED: 'Your report has been reviewed. Thank you for helping keep Collectify safe.',
    SANCTION: 'A moderator restricted your account. Check your settings for details.',
    COMMENT_REPLY: 'replied to your comment on',
    COMMENT_LIKED: 'loved your comment on',
};

/** Where clicking a notification leads. */
export function notificationHref(notification: AppNotification): string {
    const { type, sender, collection, comment } = notification;

    if (type === 'FOLLOW' && sender) return `/users/${sender.id}`;
    if (type === 'SANCTION') return '/settings';
    if (collection && comment) return `/collections/${collection.id}#comment-${comment.id}`;
    if (collection) return `/collections/${collection.id}`;
    if (sender) return `/users/${sender.id}`;

    return '/notifications';
}
