'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { usePeopleWidgetVisibility } from '../../model/visibilityStore';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import type { SuggestedUser } from '@/entities/user/model/types';
import { useFollowUser } from '@/features/user/follow/model/useFollowUser';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const WIDGET_SIZE = 5;
const PAGE_SIZE = 20;

function useReason() {
    const t = useTranslations('people');

    return (user: SuggestedUser) => {
        const parts: string[] = [];

        if (user.mutual > 0) parts.push(t('mutual', { count: user.mutual }));
        if (user.city) parts.push(t('livesIn', { city: user.city }));
        if (user.followsYou) parts.push(t('followsYou'));

        return parts.join(' · ');
    };
}

type PersonProps = {
    user: SuggestedUser;
    variant: 'compact' | 'row';
};

/**
 * Follow state comes from the suggestions cache, which every follow in the
 * app updates, so following someone elsewhere shows here too. Followed people
 * stay listed (as "Following") until the suggestions are refetched.
 */
function Person({ user, variant }: PersonProps) {
    const t = useTranslations('people');
    const reason = useReason();
    const follow = useFollowUser();
    const followed = user.isFollowed;
    const onToggle = () => follow.mutate({ userId: user.id, follow: !followed });

    return (
        <article className={`${styles.row} ${variant === 'compact' ? styles.compact : ''}`}>
            <Link href={`/users/${user.id}`} className={styles.identity}>
                <Avatar src={user.avatarUrl} alt={user.username} className={styles.avatar} />
                <span className={styles.names}>
                    <span className={styles.fullName}>{user.fullName || user.username}</span>
                    <span className={styles.username}>@{user.username}</span>
                </span>
            </Link>

            <span className={styles.reason}>{reason(user)}</span>

            {variant === 'compact' ? (
                <button
                    type="button"
                    className={`${styles.followLink} ${followed ? styles.followed : ''}`}
                    onClick={onToggle}
                    aria-pressed={followed}
                >
                    {followed ? t('following') : t('follow')}
                </button>
            ) : (
                <Button
                    size="small"
                    variant={followed ? 'outlined' : 'contained'}
                    onClick={onToggle}
                    className={styles.follow}
                >
                    {followed ? t('following') : t('follow')}
                </Button>
            )}
        </article>
    );
}

function AllPeopleDialog({ onClose }: { onClose: () => void }) {
    const t = useTranslations('people');
    const tc = useTranslations('common');
    const query = useInfiniteQuery({
        queryKey: [...userQueryKeys.suggestions(PAGE_SIZE), 'all'],
        queryFn: ({ pageParam }) => userApi.suggestions(pageParam, PAGE_SIZE),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) =>
            lastPage.hasMore ? pages.length * PAGE_SIZE : undefined,
    });

    const loadMoreRef = useInfiniteScroll({
        hasMore: query.hasNextPage,
        loading: query.isFetchingNextPage,
        onLoadMore: query.fetchNextPage,
        rootMargin: '200px 0px',
    });

    const people = query.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle className={styles.dialogTitle}>
                {t('title')}
                <IconButton onClick={onClose} aria-label={tc('close')} color="inherit">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent className={styles.dialogList}>
                {query.isPending && <Spinner />}

                {people.map((user) => (
                    <Person key={user.id} user={user} variant="row" />
                ))}

                {query.hasNextPage && (
                    <div ref={loadMoreRef}>
                        <Spinner />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Small sidebar widget: top suggestions (friends of friends, same city, people
 * who follow you), with every suggestion one click away.
 */
export function PeopleYouMayKnow() {
    const t = useTranslations('people');
    const queryClient = useQueryClient();
    const [showAll, setShowAll] = useState(false);
    const hidden = usePeopleWidgetVisibility((state) => state.hidden);
    const setHidden = usePeopleWidgetVisibility((state) => state.setHidden);

    const query = useQuery({
        queryKey: userQueryKeys.suggestions(WIDGET_SIZE),
        queryFn: () => userApi.suggestions(0, WIDGET_SIZE),
        staleTime: 5 * 60_000,
        enabled: !hidden,
    });

    if (hidden || !query.data || query.data.data.length === 0) return null;

    return (
        <section className={styles.section} aria-label={t('title')}>
            <header className={styles.header}>
                <h2 className={styles.title}>{t('title')}</h2>
                <IconButton
                    size="small"
                    className={styles.hide}
                    onClick={() => setHidden(true)}
                    aria-label={t('hide')}
                    title={t('hideHint')}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </header>

            <div className={styles.list}>
                {query.data.data.map((user) => (
                    <Person key={user.id} user={user} variant="compact" />
                ))}
            </div>

            {query.data.hasMore && (
                <button type="button" className={styles.showAll} onClick={() => setShowAll(true)}>
                    {t('seeAll')}
                </button>
            )}

            {showAll && (
                <AllPeopleDialog
                    onClose={() => {
                        setShowAll(false);
                        queryClient.invalidateQueries({ queryKey: userQueryKeys.allSuggestions() });
                    }}
                />
            )}
        </section>
    );
}
