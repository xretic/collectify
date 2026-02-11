import styles from './index.module.css';
import moment from 'moment';

interface Comment {
    id: number;
    userId: number;
    username: string;
    avatarUrl: string;
    createdAt: string;
    text: string;
}

interface Props {
    comment: Comment;
}

export function CollectionComment({ comment }: Props) {
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

                    <button className={styles.moreBtn} aria-label="Comment actions" type="button">
                        ···
                    </button>
                </header>

                <p className={styles.text}>{comment.text}</p>
            </div>
        </article>
    );
}
