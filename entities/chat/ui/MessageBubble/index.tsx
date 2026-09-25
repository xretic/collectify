'use client';

import Link from 'next/link';
import { Avatar } from '@mui/material';
import type { BubblePosition } from '../../lib/layoutMessages';
import type { ChatMessage } from '../../model/types';
import styles from './index.module.css';
import { useFormatters } from '@/shared/lib/format/useFormatters';

type MessageBubbleProps = {
    message: ChatMessage;
    /** Sent by the viewer: right side, accent color, no avatar. */
    own: boolean;
    position: BubblePosition;
};

export function MessageBubble({ message, own, position }: MessageBubbleProps) {
    const format = useFormatters();
    const showAvatar = !own && (position === 'single' || position === 'last');

    return (
        <div className={`${styles.row} ${own ? styles.own : ''} ${styles[position]}`}>
            {!own && (
                <span className={styles.avatarSlot}>
                    {showAvatar && (
                        <Link href={`/users/${message.author.id}`} tabIndex={-1}>
                            <Avatar
                                src={message.author.avatarUrl}
                                alt={message.author.username}
                                className={styles.avatar}
                            />
                        </Link>
                    )}
                </span>
            )}

            <p className={styles.bubble} title={format.dateTime(message.createdAt)}>
                {message.content}
            </p>
        </div>
    );
}
