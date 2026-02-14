import styles from './index.module.css';
import moment from 'moment';
import { useUIStore } from '@/stores/uiStore';
import CommentHoverMenu from '@/components/features/collections/CommentHoverMenu';
import { useUser } from '@/context/UserProvider';

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
    const { anchorEl, setCommentAnchorEl } = useUIStore();
    const { user, loading } = useUser();

    if (loading) return null;

    return (
        <article className={styles.comment}>
            <img
                className={styles.avatar}
                src={comment.avatarUrl}
                alt={comment.username}
                loading="lazy"
            />

            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.meta}>
                        <span className={styles.username}>{comment.username}</span>
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
                            <button onClick={(event) =>
                                setCommentAnchorEl(
                                    anchorEl === event.currentTarget ? null : event.currentTarget,
                                )
                            } className={styles.moreBtn} aria-label="Comment actions" type="button">
                                ···
                            </button>

                            <CommentHoverMenu collectionId={collectionId} commentId={comment.id} />
                        </>
                    )}
                </header>

                <p className={styles.text}>{comment.text}</p>
            </div>
        </article>
    );
}
