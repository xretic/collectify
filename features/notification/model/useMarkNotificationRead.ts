'use client';

import { useMutation } from '@tanstack/react-query';
import { notificationApi } from '@/entities/notification/api/notificationApi';
import { useNotificationCache } from './useNotificationCache';

/** Optimistically marks one notification as read. */
export function useMarkNotificationRead() {
    const cache = useNotificationCache();

    return useMutation({
        mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
        onMutate: (notificationId) => cache.markRead([notificationId]),
        onSuccess: (unread) => cache.setUnread(unread),
    });
}
