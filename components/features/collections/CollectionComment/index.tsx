import styles from './index.module.css';
import moment from 'moment';
import { useUIStore } from '@/shared/model/uiStore';
import CommentHoverMenu from '@/components/features/collections/CommentHoverMenu';
import { useUser } from '@/context/UserProvider';
import { useCommentEditStore } from '@/features/comment/edit/model/commentEditStore';
import { ConfigProvider } from 'antd';
import { COMMENT_MAX_LENGTH } from '@/lib/constans';
import { useEffect, useState } from 'react';
import { Avatar, Button, IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useQueryClient } from '@tanstack/react-query';
import TextArea from 'antd/es/input/TextArea';
import { useRouter } from 'next/navigation';
import { commentApi } from '@/entities/comment/api/commentApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { CollectionPropsAdditional } from '@/entities/collection/model/types';
import { getMutePlaceholder } from '@/lib/restrictions';
import ReportDialog from '@/components/features/reports/ReportDialog';

interface Comment {
    id: number;
    userId: number;
    username: string;
    avatarUrl: string;
    createdAt: Date;
    text: string;
}

interface Props {
    collectionId: number;
    comment: Comment;
}

export function CollectionComment({ collectionId, comment }: Props) {
    const {
        startLoading,
        stopLoading,
        commentAnchorEl,
        setCommentAnchorEl,
        setCommentId,
        commentId,
    } = useUIStore();
    const { editingCommentId, resetEditingComment } = useCommentEditStore();

    const [text, setText] = useState(comment.text);
    const [editingText, setEditingText] = useState(comment.text);
    const [reportOpen, setReportOpen] = useState(false);

    const { user, loading } = useUser();
    const router = useRouter();
    const isCommentOwner = user?.id === comment.userId;
    const canModerateComments = !!user?.roles.some(
        (role) => role === 'Admin' || role === 'Moderator',
    );
    const canEditComment = !!isCommentOwner;
    const canDeleteComment =
        !!isCommentOwner || (!!user && canModerateComments && user.id !== comment.userId);
    const commentsRestriction = user?.restrictions.comments;
    const commentsMuted = !!commentsRestriction?.muted;
    const editPlaceholder = getMutePlaceholder(
        commentsRestriction,
        'comments',
        'Editing comment...',
    );

    const buttonsSx: SxProps<Theme> = {
        borderRadius: 6,
        textTransform: 'none',
        color: 'var(--text-color)',
    };

    const queryClient = useQueryClient();

    const handleEdit = async () => {
        if (commentsMuted) return;

        if (text === editingText) {
            handleCancel();
            return;
        }

        startLoading();

        try {
            if (!commentId) return;

            await commentApi.update(commentId, editingText);

            const commentsKey = collectionQueryKeys.comments(collectionId);

            queryClient.setQueryData<{ pages: CollectionPropsAdditional[] }>(commentsKey, (old) => {
                if (!old?.pages) return old;

                return {
                    ...old,
                    pages: old.pages.map((p) => ({
                        ...p,
                        commentsRes: (p.commentsRes ?? []).map((c) =>
                            c.id === commentId ? { ...c, text: editingText } : c,
                        ),
                    })),
                };
            });

            setText(editingText);
        } finally {
            stopLoading();
            resetEditingComment();
            setEditingText(editingText);
        }
    };

    const handleCancel = () => {
        resetEditingComment();
        setEditingText(text);
    };

    useEffect(() => {
        setText(comment.text);
        setEditingText(comment.text);
    }, [comment.id, comment.text]);

    if (loading && !user) return null;

    return (
        <article className={styles.comment}>
            <Avatar className={styles.avatar} src={comment.avatarUrl} alt={comment.username} />

            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.meta}>
                        <span
                            onClick={() => router.replace('/users/' + comment?.userId)}
                            className={styles.username}
                        >
                            {comment.username}
                        </span>
                        <span className={styles.dot} />
                        <time
                            className={styles.date}
                            dateTime={new Date(comment.createdAt).toISOString()}
                        >
                            {moment(comment.createdAt).fromNow()}
                        </time>
                    </div>

                    <div className={styles.headerActions}>
                        {user && user.id !== comment.userId && (
                            <Tooltip title="Report comment">
                                <IconButton
                                    className={styles.reportBtn}
                                    size="small"
                                    onClick={() => setReportOpen(true)}
                                >
                                    <FlagOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {(canEditComment || canDeleteComment) && (
                            <button
                                onClick={(event) => {
                                    setCommentAnchorEl(
                                        commentAnchorEl === event.currentTarget
                                            ? null
                                            : event.currentTarget,
                                    );

                                    setCommentId(comment.id);
                                }}
                                className={styles.moreBtn}
                                aria-label="Comment actions"
                                type="button"
                            >
                                ···
                            </button>
                        )}
                    </div>

                    {(canEditComment || canDeleteComment) && (
                        <CommentHoverMenu
                            collectionId={collectionId}
                            canEdit={canEditComment}
                            canDelete={canDeleteComment}
                        />
                    )}
                </header>

                {editingCommentId === comment.id ? (
                    <ConfigProvider
                        theme={{
                            token: {
                                colorTextPlaceholder: 'var(--soft-text)',
                                colorIcon: 'var(--soft-text)',
                            },
                        }}
                    >
                        <TextArea
                            onChange={(e) => setEditingText(e.target.value)}
                            placeholder={editPlaceholder}
                            disabled={commentsMuted}
                            className={styles.input}
                            style={{
                                backgroundColor: 'var(--container-color)',
                                color: 'var(--text-color)',
                            }}
                            autoSize={{ minRows: 1, maxRows: 20 }}
                            value={commentsMuted ? '' : editingText}
                            maxLength={COMMENT_MAX_LENGTH}
                            showCount
                        />
                    </ConfigProvider>
                ) : (
                    <p className={styles.text}>{text}</p>
                )}
            </div>

            {editingCommentId === comment.id && (
                <div className={styles.actions}>
                    <Button variant="text" onClick={handleCancel} sx={buttonsSx}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleEdit}
                        disabled={commentsMuted || !editingText.trim() || editingText.length === 0}
                        sx={buttonsSx}
                    >
                        Confirm
                    </Button>
                </div>
            )}

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetUserId={comment.userId}
                targetUsername={comment.username}
                commentId={comment.id}
                commentPreview={text}
            />
        </article>
    );
}
