'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Avatar, Button, IconButton, Tooltip } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionAuthor } from '@/entities/collection/model/types';
import { commentApi } from '@/entities/comment/api/commentApi';
import { commentQueryKeys } from '@/entities/comment/model/queryKeys';
import type { CollectionComment } from '@/entities/comment/model/types';
import { CommentCard } from '@/entities/comment/ui/CommentCard';
import { isStaff, type SessionUser } from '@/entities/user/model/types';
import { CommentComposer } from '@/features/comment/create/ui/CommentComposer';
import { CommentEditor } from '@/features/comment/manage/ui/CommentEditor';
import { CommentMenu } from '@/features/comment/manage/ui/CommentMenu';
import { useCommentMutations } from '@/features/comment/manage/model/useCommentMutations';
import { useReportAction } from '@/features/report/create/model/useReportAction';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { formatCompact } from '@/shared/lib/format/number';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './index.module.css';

type CommentsSectionProps = {
    collectionId: number;
    /** Collection owner: hearts comments, shown as "by the author". */
    owner: CollectionAuthor;
    total: number;
    viewer: SessionUser | null;
};

/** `#comment-123` from a notification link: highlight that comment once it is rendered. */
function useLinkedComment(ready: boolean) {
    const [linkedId, setLinkedId] = useState<number | null>(null);

    useEffect(() => {
        if (!ready) return;

        const match = /^#comment-(\d+)$/.exec(window.location.hash);
        if (!match) return;

        const id = Number(match[1]);
        const element = document.getElementById(`comment-${id}`);

        (element ?? document.getElementById('comments'))?.scrollIntoView({ block: 'center' });
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the URL hash once the list exists
        setLinkedId(id);

        const timer = setTimeout(() => setLinkedId(null), 2500);
        return () => clearTimeout(timer);
    }, [ready]);

    return linkedId;
}

export function CommentsSection({ collectionId, owner, total, viewer }: CommentsSectionProps) {
    const query = useInfiniteQuery({
        queryKey: commentQueryKeys.byCollection(collectionId),
        queryFn: ({ pageParam }) => collectionApi.comments(collectionId, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

    const loadMoreRef = useInfiniteScroll({
        hasMore: hasNextPage,
        loading: isFetchingNextPage,
        onLoadMore: fetchNextPage,
        rootMargin: '300px 0px',
    });

    const linkedId = useLinkedComment(query.isSuccess);
    const comments = query.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <section id="comments" className={styles.section}>
            <h2 className={styles.title}>
                {formatCompact(query.data?.pages[0]?.total ?? total)} comments
            </h2>

            {viewer && <CommentComposer collectionId={collectionId} viewer={viewer} />}

            {query.isPending && <Spinner />}

            {!query.isPending && comments.length === 0 && (
                <EmptyState title="No comments yet." description="Start the conversation." />
            )}

            <div className={styles.list}>
                {comments.map((comment) => (
                    <CommentThread
                        key={comment.id}
                        collectionId={collectionId}
                        comment={comment}
                        owner={owner}
                        viewer={viewer}
                        linkedId={linkedId}
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

type ThreadProps = {
    collectionId: number;
    comment: CollectionComment;
    owner: CollectionAuthor;
    viewer: SessionUser | null;
    linkedId: number | null;
};

function CommentThread({ collectionId, comment, owner, viewer, linkedId }: ThreadProps) {
    const [open, setOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<CollectionComment | null>(null);

    const replies = useInfiniteQuery({
        queryKey: commentQueryKeys.replies(collectionId, comment.id),
        queryFn: ({ pageParam }) => commentApi.replies(comment.id, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: open,
    });

    const startReply = (target: CollectionComment) => {
        setReplyingTo(target);
        setOpen(true);
    };

    const loaded = replies.data?.pages.flatMap((page) => page.data) ?? [];

    return (
        <div className={styles.thread}>
            <CommentItem
                collectionId={collectionId}
                comment={comment}
                owner={owner}
                viewer={viewer}
                highlighted={linkedId === comment.id}
                onReply={() => startReply(comment)}
            />

            <div className={styles.replies}>
                {comment.replies > 0 && (
                    <button
                        type="button"
                        className={styles.repliesToggle}
                        onClick={() => setOpen((value) => !value)}
                        aria-expanded={open}
                    >
                        {open ? (
                            <KeyboardArrowUpIcon fontSize="small" />
                        ) : (
                            <KeyboardArrowDownIcon fontSize="small" />
                        )}
                        {comment.replies} {comment.replies === 1 ? 'reply' : 'replies'}
                    </button>
                )}

                {open && (
                    <>
                        {replies.isPending && <Spinner />}

                        {loaded.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                collectionId={collectionId}
                                comment={reply}
                                owner={owner}
                                viewer={viewer}
                                highlighted={linkedId === reply.id}
                                onReply={() => startReply(reply)}
                            />
                        ))}

                        {replies.hasNextPage && (
                            <button
                                type="button"
                                className={styles.repliesToggle}
                                onClick={() => replies.fetchNextPage()}
                                disabled={replies.isFetchingNextPage}
                            >
                                Show more replies
                            </button>
                        )}
                    </>
                )}

                {viewer && replyingTo && (
                    <CommentComposer
                        key={replyingTo.id}
                        collectionId={collectionId}
                        viewer={viewer}
                        replyTo={replyingTo}
                        onDone={() => setReplyingTo(null)}
                    />
                )}
            </div>
        </div>
    );
}

type ItemProps = {
    collectionId: number;
    comment: CollectionComment;
    owner: CollectionAuthor;
    viewer: SessionUser | null;
    highlighted: boolean;
    onReply: () => void;
};

function CommentItem({ collectionId, comment, owner, viewer, highlighted, onReply }: ItemProps) {
    const { update, remove, heart } = useCommentMutations(collectionId);
    const [editing, setEditing] = useState(false);

    const isAuthor = viewer?.id === comment.author.id;
    const isOwner = viewer?.id === owner.id;
    const canModerate = Boolean(viewer && !isAuthor && isStaff(viewer.roles));

    const report = useReportAction({
        target: { type: 'COMMENT', commentId: comment.id },
        username: comment.author.username,
        preview: comment.text,
    });

    const actions = viewer && (
        <CommentMenu
            canEdit={isAuthor && !viewer.restrictions.comments.muted}
            canDelete={isAuthor || canModerate}
            asModerator={canModerate}
            deleting={remove.isPending}
            onEdit={() => setEditing(true)}
            onDelete={() => remove.mutate(comment)}
            extraItems={isAuthor ? [] : [report]}
        />
    );

    const footer = (
        <>
            {viewer && !viewer.restrictions.comments.muted && (
                <Button size="small" className={styles.replyButton} onClick={onReply}>
                    Reply
                </Button>
            )}

            {isOwner ? (
                <Tooltip title={comment.likedByAuthor ? 'Remove heart' : 'Heart this comment'}>
                    <IconButton
                        size="small"
                        className={comment.likedByAuthor ? styles.hearted : undefined}
                        onClick={() =>
                            heart.mutate({ commentId: comment.id, liked: !comment.likedByAuthor })
                        }
                        aria-pressed={comment.likedByAuthor}
                        aria-label="Heart comment"
                    >
                        {comment.likedByAuthor ? (
                            <FavoriteIcon fontSize="small" />
                        ) : (
                            <FavoriteBorderIcon fontSize="small" />
                        )}
                    </IconButton>
                </Tooltip>
            ) : (
                comment.likedByAuthor && (
                    <Tooltip title={`♥ by ${owner.username}`}>
                        <span className={styles.authorHeart}>
                            <Avatar
                                src={owner.avatarUrl}
                                alt={owner.username}
                                className={styles.heartAvatar}
                            />
                            <FavoriteIcon className={styles.heartIcon} />
                        </span>
                    </Tooltip>
                )
            )}
        </>
    );

    return (
        <CommentCard
            comment={comment}
            compact={comment.parentId !== null}
            actions={actions}
            footer={editing ? undefined : footer}
            highlighted={highlighted}
        >
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
