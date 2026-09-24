'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import { formatDateTime } from '@/shared/lib/format/date';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './index.module.css';

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
    const collections = useHistory(managementQueryKeys.collections(userId), (skip) =>
        managementApi.collections(userId, skip),
    );
    const comments = useHistory(managementQueryKeys.comments(userId), (skip) =>
        managementApi.comments(userId, skip),
    );

    return (
        <div className={styles.grid}>
            <div className={styles.column}>
                <h4 className={styles.heading}>Collections</h4>

                {collections.isSuccess && collections.rows.length === 0 && (
                    <EmptyState title="No collections" />
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
                            {collection.category} · {formatDateTime(collection.createdAt)}
                            {collection.isPrivate && ' · private'}
                        </span>
                        <span className={styles.muted}>
                            {collection.counts.items} items · {collection.counts.comments} comments
                            · {collection.counts.likes} likes
                        </span>
                    </Link>
                ))}

                {collections.hasNextPage && (
                    <Button
                        size="small"
                        onClick={() => collections.fetchNextPage()}
                        disabled={collections.isFetchingNextPage}
                    >
                        Load more
                    </Button>
                )}
            </div>

            <div className={styles.column}>
                <h4 className={styles.heading}>Comments</h4>

                {comments.isSuccess && comments.rows.length === 0 && (
                    <EmptyState title="No comments" />
                )}

                {comments.rows.map((comment) => (
                    <Link
                        key={comment.id}
                        href={`/collections/${comment.collection.id}`}
                        className={styles.item}
                        target="_blank"
                    >
                        <span className={styles.itemTitle}>{comment.collection.name}</span>
                        <span className={styles.muted}>{formatDateTime(comment.createdAt)}</span>
                        <p className={styles.text}>{comment.text}</p>
                    </Link>
                ))}

                {comments.hasNextPage && (
                    <Button
                        size="small"
                        onClick={() => comments.fetchNextPage()}
                        disabled={comments.isFetchingNextPage}
                    >
                        Load more
                    </Button>
                )}
            </div>
        </div>
    );
}
