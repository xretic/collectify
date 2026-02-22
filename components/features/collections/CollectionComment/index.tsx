import styles from './index.module.css';
import moment from 'moment';
import { useUIStore } from '@/stores/uiStore';
import CommentHoverMenu from '@/components/features/collections/CommentHoverMenu';
import { useUser } from '@/context/UserProvider';
import { useCommentEditStore } from '@/stores/commentEditStore';
import { ConfigProvider } from 'antd';
import { COMMENT_MAX_LENGTH } from '@/lib/constans';
import { useEffect, useState } from 'react';
import { Avatar, Button, SxProps, Theme } from '@mui/material';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import TextArea from 'antd/es/input/TextArea';
import { useRouter } from 'next/navigation';

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

    const { user, loading } = useUser();
    const router = useRouter();

    const buttonsSx: SxProps<Theme> = {
        borderRadius: 6,
        textTransform: 'none',
        color: 'var(--text-color)',
    };

    const queryClient = useQueryClient();

    const handleEdit = async () => {
        if (text === editingText) {
            handleCancel();
            return;
        }

        startLoading();

        try {
            await api.patch(`api/comments/${commentId}`, { json: { text: editingText } });

            const commentsKey = ['collection-comments', String(collectionId)] as const;

            queryClient.setQueryData(commentsKey, (old: any) => {
                if (!old?.pages) return old;

                return {
                    ...old,
                    pages: old.pages.map((p: any) => ({
                        ...p,
                        commentsRes: (p.commentsRes ?? []).map((c: any) =>
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

    if (loading) return null;

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

                    {user?.id === comment.userId && (
                        <>
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

                            <CommentHoverMenu collectionId={collectionId} />
                        </>
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
                            placeholder="Editing comment..."
                            className={styles.input}
                            style={{
                                backgroundColor: 'var(--container-color)',
                                color: 'var(--text-color)',
                            }}
                            autoSize={{ minRows: 1, maxRows: 20 }}
                            value={editingText}
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
                        disabled={!editingText.trim() || editingText.length === 0}
                        sx={buttonsSx}
                    >
                        Confirm
                    </Button>
                </div>
            )}
        </article>
    );
}
