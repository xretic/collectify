import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar } from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import type { ChatMessage } from '../../model/types';
import styles from './index.module.css';

type MessageNoticeProps = {
    message: ChatMessage;
    /** Called when the notice is opened (before navigation). */
    onOpen?: () => void;
    /** Extra controls on the right (e.g. a close button). */
    aside?: ReactNode;
};

/** Pop-up card about a new direct message; links to its chat. */
export function MessageNotice({ message, onOpen, aside }: MessageNoticeProps) {
    const { author } = message;

    return (
        <article className={styles.notice}>
            <Link href={`/chats/${message.chatId}`} className={styles.link} onClick={onOpen}>
                <span className={styles.avatarWrap}>
                    <Avatar
                        className={styles.avatar}
                        src={author.avatarUrl}
                        alt={author.username}
                    />
                    <span className={styles.typeIcon}>
                        <ChatBubbleIcon />
                    </span>
                </span>

                <span className={styles.content}>
                    <span className={styles.head}>
                        <strong className={styles.author}>{author.username}</strong>
                        <RelativeTime value={message.createdAt} className={styles.time} />
                    </span>
                    <span className={styles.text}>{message.content}</span>
                </span>
            </Link>

            {aside}
        </article>
    );
}
