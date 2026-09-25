'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar, Tooltip } from '@mui/material';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import type { CollectionComment } from '../../model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';

type CommentCardProps = {
    comment: CollectionComment;
    /** Replies are rendered smaller, indented under their thread. */
    compact?: boolean;
    /** Actions menu shown on the right of the header. */
    actions?: ReactNode;
    /** Row under the text: reply button, author heart, replies toggle… */
    footer?: ReactNode;
    /** Replaces the text (e.g. an inline editor). */
    children?: ReactNode;
    /** Briefly highlighted (opened from a notification link). */
    highlighted?: boolean;
};

export function CommentCard({
    comment,
    compact = false,
    actions,
    footer,
    children,
    highlighted = false,
}: CommentCardProps) {
    const t = useTranslations('comments');
    const format = useFormatters();

    return (
        <article
            id={`comment-${comment.id}`}
            className={`${styles.comment} ${compact ? styles.compact : ''} ${highlighted ? styles.highlighted : ''}`}
        >
            <Link href={`/users/${comment.author.id}`} className={styles.avatarLink}>
                <Avatar
                    className={styles.avatar}
                    src={comment.author.avatarUrl}
                    alt={comment.author.username}
                />
            </Link>

            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.meta}>
                        <Link href={`/users/${comment.author.id}`} className={styles.username}>
                            @{comment.author.username}
                        </Link>
                        <RelativeTime value={comment.createdAt} className={styles.date} />
                        {comment.editedAt && (
                            <Tooltip
                                title={t('editedAt', { date: format.dateTime(comment.editedAt) })}
                            >
                                <span className={styles.edited} tabIndex={0}>
                                    {t('edited')}
                                </span>
                            </Tooltip>
                        )}
                    </div>

                    {actions && <div className={styles.actions}>{actions}</div>}
                </header>

                {children ?? (
                    <p className={styles.text}>
                        {comment.replyTo && (
                            <Link href={`/users/${comment.replyTo.id}`} className={styles.mention}>
                                @{comment.replyTo.username}
                            </Link>
                        )}
                        {comment.replyTo && ' '}
                        {comment.text}
                    </p>
                )}

                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </article>
    );
}
