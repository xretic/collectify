import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar } from '@mui/material';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import type { ChatMessage } from '../../model/types';
import styles from './index.module.css';

export function MessageBubble({ message, actions }: { message: ChatMessage; actions?: ReactNode }) {
    return (
        <div className={styles.message}>
            <Avatar
                src={message.author.avatarUrl}
                alt={message.author.username}
                className={styles.avatar}
            />

            <div className={styles.body}>
                <p className={styles.meta}>
                    <Link href={`/users/${message.author.id}`} className={styles.username}>
                        {message.author.username}
                    </Link>
                    <RelativeTime value={message.createdAt} className={styles.date} />
                </p>
                <p className={styles.content}>{message.content}</p>
            </div>

            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    );
}
