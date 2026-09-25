'use client';

import { useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { notificationApi } from '@/entities/notification/api/notificationApi';
import { notificationQueryKeys } from '@/entities/notification/model/queryKeys';
import type { AppNotification } from '@/entities/notification/model/types';
import { NotificationItem } from '@/entities/notification/ui/NotificationItem';
import { useMarkNotificationRead } from '@/features/notification/model/useMarkNotificationRead';
import { useNotificationCache } from '@/features/notification/model/useNotificationCache';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { toast } from '@/shared/model/toastStore';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { TabIndicator } from '@/shared/ui/TabIndicator';
import styles from './NotificationsPage.module.css';

type Tab = 'all' | 'unread';

const DAY = 24 * 60 * 60 * 1000;

function groupLabel(createdAt: string, now: Date) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const time = new Date(createdAt).getTime();

    if (time >= startOfToday) return 'Today';
    if (time >= startOfToday - DAY) return 'Yesterday';
    if (time >= startOfToday - 6 * DAY) return 'This week';
    return 'Earlier';
}

function groupByDay(notifications: AppNotification[]) {
    const now = new Date();
    const groups: { label: string; items: AppNotification[] }[] = [];

    for (const notification of notifications) {
        const label = groupLabel(notification.createdAt, now);
        const last = groups.at(-1);

        if (last?.label === label) last.items.push(notification);
        else groups.push({ label, items: [notification] });
    }

    return groups;
}

export default function NotificationsPage() {
    const cache = useNotificationCache();
    const markRead = useMarkNotificationRead();
    const [tab, setTab] = useState<Tab>('all');

    const query = useInfiniteQuery({
        queryKey: notificationQueryKeys.list(tab === 'unread'),
        queryFn: ({ pageParam }) => notificationApi.list(tab === 'unread', pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const unread = query.data?.pages[0]?.unread ?? 0;
    const notifications = useMemo(
        () => query.data?.pages.flatMap((page) => page.data) ?? [],
        [query.data],
    );
    const groups = useMemo(() => groupByDay(notifications), [notifications]);

    const loadMoreRef = useInfiniteScroll({
        hasMore: query.hasNextPage,
        loading: query.isFetchingNextPage,
        onLoadMore: query.fetchNextPage,
    });

    const markAllRead = useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onMutate: () => {
            cache.markRead(notifications.map((notification) => notification.id));
            cache.setUnread(0);
        },
        onError: async (error) => {
            cache.refetchLists();
            toast.error(await getApiErrorMessage(error));
        },
    });

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Notifications</h1>

                <Button
                    size="small"
                    startIcon={<DoneAllIcon />}
                    onClick={() => markAllRead.mutate()}
                    disabled={unread === 0 || markAllRead.isPending}
                >
                    Mark all as read
                </Button>
            </header>

            <div className={styles.tabs} role="tablist">
                {(['all', 'unread'] as const).map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        className={`${styles.tab} ${tab === value ? styles.tabActive : ''}`}
                        onClick={() => setTab(value)}
                    >
                        {value === 'all' ? 'All' : 'Unread'}
                        {value === 'unread' && unread > 0 && (
                            <span className={styles.counter}>{unread}</span>
                        )}
                    </button>
                ))}
                <TabIndicator />
            </div>

            {query.isPending && <Spinner />}

            {query.isSuccess && notifications.length === 0 && (
                <EmptyState
                    title={tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    description="You're all caught up."
                />
            )}

            {groups.map((group) => (
                <section key={group.label} className={styles.group}>
                    <h2 className={styles.groupTitle}>{group.label}</h2>
                    <div className={styles.list}>
                        {group.items.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onOpen={(opened) => !opened.isRead && markRead.mutate(opened.id)}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {query.hasNextPage && (
                <div ref={loadMoreRef} className={styles.more}>
                    <Spinner />
                </div>
            )}
        </section>
    );
}
