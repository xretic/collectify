import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar } from '@mui/material';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import type { CollectionComment } from '../../model/types';
import styles from './index.module.css';

type CommentCardProps = {
    comment: CollectionComment;
    /** Report button / actions menu shown on the right of the header. */
    actions?: ReactNode;
    /** Replaces the text (e.g. an inline editor). */
    children?: ReactNode;
};

export function CommentCard({ comment, actions, children }: CommentCardProps) {
    return (
        <article className={styles.comment}>
            <Avatar
                className={styles.avatar}
                src={comment.author.avatarUrl}
                alt={comment.author.username}
            />

            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.meta}>
                        <Link href={`/users/${comment.author.id}`} className={styles.username}>
                            {comment.author.username}
                        </Link>
                        <span className={styles.dot} />
                        <RelativeTime value={comment.createdAt} className={styles.date} />
                    </div>

                    {actions && <div className={styles.actions}>{actions}</div>}
                </header>

                {children ?? <p className={styles.text}>{comment.text}</p>}
            </div>
        </article>
    );
}
