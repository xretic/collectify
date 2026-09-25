'use client';

import { useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { notificationQueryKeys } from '@/entities/notification/model/queryKeys';
import type { NotificationsPage } from '@/entities/notification/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import type { SessionUser } from '@/entities/user/model/types';

type Pages = InfiniteData<NotificationsPage, number | null>;

/** Keeps the navbar badge and the notification lists in sync without refetching. */
export function useNotificationCache() {
    const queryClient = useQueryClient();

    const setUnread = useCallback(
        (unread: number) => {
            queryClient.setQueryData<SessionUser | null>(sessionUserQueryKey, (user) =>
                user ? { ...user, notifications: unread } : user,
            );
            queryClient.setQueriesData<Pages>(
                { queryKey: notificationQueryKeys.all },
                (data) =>
                    data && {
                        ...data,
                        pages: data.pages.map((page) => ({ ...page, unread })),
                    },
            );
        },
        [queryClient],
    );

    const markRead = useCallback(
        (ids: number[]) =>
            queryClient.setQueriesData<Pages>(
                { queryKey: notificationQueryKeys.all },
                (data) =>
                    data && {
                        ...data,
                        pages: data.pages.map((page) => ({
                            ...page,
                            data: page.data.map((item) =>
                                ids.includes(item.id) ? { ...item, isRead: true } : item,
                            ),
                        })),
                    },
            ),
        [queryClient],
    );

    const refetchLists = useCallback(
        () => queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all }),
        [queryClient],
    );

    return { setUnread, markRead, refetchLists };
}
