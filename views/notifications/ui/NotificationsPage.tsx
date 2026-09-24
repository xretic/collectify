'use client';

import { useState, type MouseEvent } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import { notificationApi } from '@/entities/notification/api/notificationApi';
import { notificationQueryKeys } from '@/entities/notification/model/queryKeys';
import { NotificationRow } from '@/entities/notification/ui/NotificationRow';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './NotificationsPage.module.css';

type Tab = 'all' | 'unread';

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>('all');

    const query = useInfiniteQuery({
        queryKey: notificationQueryKeys.list(tab === 'unread'),
        queryFn: ({ pageParam }) => notificationApi.list(tab === 'unread', pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const unread = query.data?.pages[0]?.unread ?? 0;
    const notifications = query.data?.pages.flatMap((page) => page.data) ?? [];

    const markAllRead = useMutation({
        mutationFn: notificationApi.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: sessionUserQueryKey });
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    // Following any link from the list counts as having read the notifications.
    const handleListClick = (event: MouseEvent) => {
        const clickedLink = (event.target as HTMLElement).closest('a');
        if (clickedLink && unread > 0 && !markAllRead.isPending) markAllRead.mutate();
    };

    return (
        <>
            <header className={styles.toolbar}>
                {(['all', 'unread'] as const).map((value) => (
                    <Button
                        key={value}
                        variant={tab === value ? 'contained' : 'outlined'}
                        onClick={() => setTab(value)}
                    >
                        {value === 'all' ? 'All' : 'Unread'}
                        {value === 'unread' && <span className={styles.counter}>{unread}</span>}
                    </Button>
                ))}

                <Button
                    className={styles.markAll}
                    startIcon={<DoneIcon />}
                    onClick={() => markAllRead.mutate()}
                    disabled={unread === 0 || markAllRead.isPending}
                >
                    Mark all as read
                </Button>
            </header>

            <section className={styles.list} onClickCapture={handleListClick}>
                {query.isPending && <Spinner />}

                {query.isSuccess && notifications.length === 0 && (
                    <EmptyState
                        title={
                            tab === 'unread' ? 'No unread notifications' : 'No notifications yet'
                        }
                        description="You're all caught up! Check back later for new updates."
                    />
                )}

                {notifications.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} />
                ))}

                {query.hasNextPage && (
                    <Button
                        onClick={() => query.fetchNextPage()}
                        disabled={query.isFetchingNextPage}
                    >
                        Load more
                    </Button>
                )}
            </section>
        </>
    );
}
