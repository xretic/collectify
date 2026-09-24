'use client';

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { commentQueryKeys } from '@/entities/comment/model/queryKeys';
import type { CollectionComment } from '@/entities/comment/model/types';
import { CommentCard } from '@/entities/comment/ui/CommentCard';
import { isStaff, type SessionUser } from '@/entities/user/model/types';
import { CommentComposer } from '@/features/comment/create/ui/CommentComposer';
import { CommentEditor } from '@/features/comment/manage/ui/CommentEditor';
import { CommentMenu } from '@/features/comment/manage/ui/CommentMenu';
import { useCommentMutations } from '@/features/comment/manage/model/useCommentMutations';
import { ReportButton } from '@/features/report/create/ui/ReportButton';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './index.module.css';

type CommentsSectionProps = {
    collectionId: number;
    total: number;
    viewer: SessionUser | null;
};

export function CommentsSection({ collectionId, total, viewer }: CommentsSectionProps) {
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const query = useInfiniteQuery({
        queryKey: commentQueryKeys.byCollection(collectionId),
        queryFn: ({ pageParam }) => collectionApi.comments(collectionId, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element || !hasNextPage) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
            },
            { rootMargin: '300px 0px' },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const comments = query.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>{total} comments</h2>

            {viewer && (
                <CommentComposer
                    collectionId={collectionId}
                    restriction={viewer.restrictions.comments}
                />
            )}

            {query.isPending && <Spinner />}

            {!query.isPending && comments.length === 0 && <EmptyState title="No comments yet." />}

            <div className={styles.list}>
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        collectionId={collectionId}
                        comment={comment}
                        viewer={viewer}
                    />
                ))}
            </div>

            {hasNextPage && (
                <div ref={loadMoreRef} className={styles.more}>
                    {isFetchingNextPage ? (
                        <Spinner />
                    ) : (
                        <Button onClick={() => fetchNextPage()}>Load more</Button>
                    )}
                </div>
            )}
        </section>
    );
}

type CommentItemProps = {
    collectionId: number;
    comment: CollectionComment;
    viewer: SessionUser | null;
};

function CommentItem({ collectionId, comment, viewer }: CommentItemProps) {
    const { update, remove } = useCommentMutations(collectionId);
    const [editing, setEditing] = useState(false);

    const isAuthor = viewer?.id === comment.author.id;
    const canModerate = Boolean(viewer && !isAuthor && isStaff(viewer.roles));

    const actions = viewer && (
        <>
            {!isAuthor && (
                <ReportButton
                    size="small"
                    target={{ type: 'COMMENT', commentId: comment.id }}
                    username={comment.author.username}
                    preview={comment.text}
                />
            )}

            {(isAuthor || canModerate) && (
                <CommentMenu
                    canEdit={isAuthor && !viewer.restrictions.comments.muted}
                    asModerator={canModerate}
                    deleting={remove.isPending}
                    onEdit={() => setEditing(true)}
                    onDelete={() => remove.mutate(comment.id)}
                />
            )}
        </>
    );

    return (
        <CommentCard comment={comment} actions={actions}>
            {editing ? (
                <CommentEditor
                    initialText={comment.text}
                    pending={update.isPending}
                    onCancel={() => setEditing(false)}
                    onSave={(text) =>
                        update.mutate(
                            { commentId: comment.id, text },
                            { onSuccess: () => setEditing(false) },
                        )
                    }
                />
            ) : undefined}
        </CommentCard>
    );
}
