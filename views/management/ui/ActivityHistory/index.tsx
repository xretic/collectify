'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

function useHistory<T>(
    key: readonly unknown[],
    fetchPage: (skip: number) => Promise<{ data: T[]; nextSkip: number | null }>,
) {
    const query = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => fetchPage(pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextSkip,
    });

    return { ...query, rows: query.data?.pages.flatMap((page) => page.data) ?? [] };
}

export function ActivityHistory({ userId }: { userId: number }) {
    const t = useTranslations('management.activity');
    const tc = useTranslations('common');
    const format = useFormatters();
    const collections = useHistory(managementQueryKeys.collections(userId), (skip) =>
        managementApi.collections(userId, skip),
    );
    const comments = useHistory(managementQueryKeys.comments(userId), (skip) =>
        managementApi.comments(userId, skip),
    );

    return (
        <div className={styles.grid}>
            <div className={styles.column}>
                <h4 className={styles.heading}>{t('collections')}</h4>

                {collections.isSuccess && collections.rows.length === 0 && (
                    <EmptyState title={t('noCollections')} />
                )}

                {collections.rows.map((collection) => (
                    <Link
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        className={styles.item}
                        target="_blank"
                    >
                        <span className={styles.itemTitle}>{collection.name}</span>
                        <span className={styles.muted}>
                            {collection.category} · {format.dateTime(collection.createdAt)}
                            {collection.isPrivate && ` · ${t('private')}`}
                        </span>
                        <span className={styles.muted}>{t('counts', collection.counts)}</span>
                    </Link>
                ))}

                {collections.hasNextPage && (
                    <Button
                        size="small"
                        onClick={() => collections.fetchNextPage()}
                        disabled={collections.isFetchingNextPage}
                    >
                        {tc('loadMore')}
                    </Button>
                )}
            </div>

            <div className={styles.column}>
                <h4 className={styles.heading}>{t('comments')}</h4>

                {comments.isSuccess && comments.rows.length === 0 && (
                    <EmptyState title={t('noComments')} />
                )}

                {comments.rows.map((comment) => (
                    <Link
                        key={comment.id}
                        href={`/collections/${comment.collection.id}`}
                        className={styles.item}
                        target="_blank"
                    >
                        <span className={styles.itemTitle}>{comment.collection.name}</span>
                        <span className={styles.muted}>{format.dateTime(comment.createdAt)}</span>
                        <p className={styles.text}>{comment.text}</p>
                    </Link>
                ))}

                {comments.hasNextPage && (
                    <Button
                        size="small"
                        onClick={() => comments.fetchNextPage()}
                        disabled={comments.isFetchingNextPage}
                    >
                        {tc('loadMore')}
                    </Button>
                )}
            </div>
        </div>
    );
}
