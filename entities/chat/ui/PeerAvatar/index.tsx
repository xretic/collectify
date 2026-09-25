'use client';

import { Avatar } from '@mui/material';
import { useIsOnline } from '../../model/presenceStore';
import type { ChatPeer } from '../../model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type PeerAvatarProps = {
    user: ChatPeer | null;
    /** Size class from the parent's CSS module (sets width/height). */
    className?: string;
};

/** Avatar of a chat partner with the green "online" dot. */
export function PeerAvatar({ user, className }: PeerAvatarProps) {
    const t = useTranslations('chats');
    const online = useIsOnline(user);

    return (
        <span className={`${styles.root} ${className ?? ''}`}>
            <Avatar className={styles.avatar} src={user?.avatarUrl} alt={user?.username} />
            {online && <span className={styles.dot} aria-label={t('online')} role="img" />}
        </span>
    );
}
