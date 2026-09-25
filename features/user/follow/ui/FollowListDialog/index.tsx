'use client';

import Link from 'next/link';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Dialog, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import type { FollowListKind } from '@/entities/user/model/types';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { TabIndicator } from '@/shared/ui/TabIndicator';
import { useFollowUser } from '../../model/useFollowUser';
import styles from './index.module.css';

type FollowListDialogProps = {
    userId: number;
    kind: FollowListKind;
    onKindChange: (kind: FollowListKind) => void;
    onClose: () => void;
};

const TABS: { kind: FollowListKind; label: string }[] = [
    { kind: 'followers', label: 'Followers' },
    { kind: 'following', label: 'Following' },
];

/** Followers / following of a profile; the next page loads as the list scrolls. */
export function FollowListDialog({ userId, kind, onKindChange, onClose }: FollowListDialogProps) {
    const { user: viewer } = useSessionUser();
    const queryClient = useQueryClient();
    const key = userQueryKeys.follows(userId, kind);

    const query = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => userApi.follows(userId, kind, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const loadMoreRef = useInfiniteScroll({
        hasMore: query.hasNextPage,
        loading: query.isFetchingNextPage,
        onLoadMore: query.fetchNextPage,
        rootMargin: '200px 0px',
    });

    const follow = useFollowUser();

    const users = query.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="xs" classes={{ paper: styles.paper }}>
            <DialogTitle className={styles.header}>
                <span className={styles.tabs} role="tablist">
                    {TABS.map((tab) => (
                        <button
                            key={tab.kind}
                            type="button"
                            role="tab"
                            aria-selected={tab.kind === kind}
                            className={`${styles.tab} ${tab.kind === kind ? styles.active : ''}`}
                            onClick={() => onKindChange(tab.kind)}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <TabIndicator />
                </span>
                <IconButton onClick={onClose} aria-label="Close" color="inherit">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <div className={styles.list}>
                {query.isPending && <Spinner />}

                {query.isSuccess && users.length === 0 && (
                    <EmptyState
                        title={kind === 'followers' ? 'No followers yet' : 'Not following anyone'}
                    />
                )}

                {users.map((user) => (
                    <div key={user.id} className={styles.row}>
                        <Link
                            href={`/users/${user.id}`}
                            className={styles.identity}
                            onClick={onClose}
                        >
                            <Avatar
                                src={user.avatarUrl}
                                alt={user.username}
                                className={styles.avatar}
                            />
                            <span className={styles.names}>
                                <span className={styles.fullName}>
                                    {user.fullName || user.username}
                                </span>
                                <span className={styles.username}>@{user.username}</span>
                            </span>
                        </Link>

                        {viewer && viewer.id !== user.id && (
                            <Button
                                size="small"
                                variant={user.isFollowed ? 'outlined' : 'contained'}
                                className={styles.follow}
                                onClick={() =>
                                    follow.mutate(
                                        { userId: user.id, follow: !user.isFollowed },
                                        {
                                            // Counters of the profile the list belongs to.
                                            onSuccess: () =>
                                                queryClient.invalidateQueries({
                                                    queryKey: userQueryKeys.detail(userId),
                                                }),
                                        },
                                    )
                                }
                            >
                                {user.isFollowed ? 'Following' : 'Follow'}
                            </Button>
                        )}
                    </div>
                ))}

                {query.hasNextPage && (
                    <div ref={loadMoreRef} className={styles.more}>
                        <Spinner />
                    </div>
                )}
            </div>
        </Dialog>
    );
}
