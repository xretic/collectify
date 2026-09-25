'use client';

import Link from 'next/link';
import { IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import type { ChatPeer } from '@/entities/chat/model/types';
import { PeerAvatar } from '@/entities/chat/ui/PeerAvatar';
import { TypingIndicator } from '@/entities/chat/ui/TypingIndicator';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type ChatHeaderProps = {
    peer: ChatPeer | null;
    /** The other participant deleted their account. */
    deleted: boolean;
    online: boolean;
    typing?: boolean;
};

export function ChatHeader({ peer, deleted, online, typing = false }: ChatHeaderProps) {
    const t = useTranslations('chats');

    return (
        <header className={styles.header}>
            <IconButton
                component={Link}
                href="/chats"
                className={styles.back}
                aria-label={t('back')}
            >
                <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            {peer ? (
                <Link href={`/users/${peer.id}`} className={styles.peer}>
                    <PeerAvatar user={peer} className={styles.peerAvatar} />
                    <span className={styles.peerText}>
                        <span className={styles.peerName}>{peer.username}</span>
                        {typing ? (
                            <TypingIndicator className={styles.peerTyping} />
                        ) : (
                            <span
                                className={`${styles.peerStatus} ${online ? styles.peerOnline : ''}`}
                            >
                                {online ? t('online') : t('directMessages')}
                            </span>
                        )}
                    </span>
                </Link>
            ) : (
                <span className={styles.peerName}>{deleted ? t('deletedAccount') : ''}</span>
            )}
        </header>
    );
}

/** Shown above the first message of a conversation. */
export function ChatIntro({ peer }: { peer: ChatPeer }) {
    const t = useTranslations('chats');

    return (
        <div className={styles.intro}>
            <PeerAvatar user={peer} className={styles.introAvatar} />
            <span className={styles.introName}>{peer.username}</span>
            <Link href={`/users/${peer.id}`} className={styles.introLink}>
                {t('viewProfile')}
            </Link>
        </div>
    );
}
