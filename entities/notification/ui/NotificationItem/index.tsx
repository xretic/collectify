'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ReplyIcon from '@mui/icons-material/Reply';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ShieldIcon from '@mui/icons-material/Shield';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import { notificationHref, type AppNotification, type NotificationType } from '../../model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const ICONS: Record<NotificationType, { Icon: SvgIconComponent; tone: string }> = {
    LIKE: { Icon: FavoriteIcon, tone: styles.like },
    FAVORITE: { Icon: BookmarkIcon, tone: styles.favorite },
    COMMENT: { Icon: ChatBubbleIcon, tone: styles.accent },
    FOLLOW: { Icon: PersonAddAlt1Icon, tone: styles.accent },
    REPORT_RESOLVED: { Icon: ShieldIcon, tone: styles.accent },
    SANCTION: { Icon: GavelIcon, tone: styles.like },
    COMMENT_REPLY: { Icon: ReplyIcon, tone: styles.accent },
    COMMENT_LIKED: { Icon: FavoriteIcon, tone: styles.like },
};

type NotificationItemProps = {
    notification: AppNotification;
    /** `row` for the notifications page, `toast` for the live pop-up card. */
    variant?: 'row' | 'toast';
    /** Called when the notification is opened (before navigation). */
    onOpen?: (notification: AppNotification) => void;
    /** Extra controls on the right (e.g. a close button). */
    aside?: ReactNode;
};

/** One notification; the whole item links to what it is about. */
export function NotificationItem({
    notification,
    variant = 'row',
    onOpen,
    aside,
}: NotificationItemProps) {
    const t = useTranslations('notifications');
    const { Icon, tone } = ICONS[notification.type];
    const { sender, collection, comment } = notification;

    return (
        <article
            className={`${styles.item} ${styles[variant]} ${notification.isRead ? '' : styles.unread}`}
        >
            <Link
                href={notificationHref(notification)}
                className={styles.link}
                onClick={() => onOpen?.(notification)}
            >
                <span className={styles.avatarWrap}>
                    {sender ? (
                        <Avatar
                            className={styles.avatar}
                            src={sender.avatarUrl}
                            alt={sender.username}
                        />
                    ) : (
                        <span className={`${styles.avatar} ${styles.system}`}>
                            <Icon />
                        </span>
                    )}
                    {sender && (
                        <span className={`${styles.typeIcon} ${tone}`}>
                            <Icon />
                        </span>
                    )}
                </span>

                <span className={styles.content}>
                    <span className={styles.text}>
                        {sender && <strong className={styles.strong}>{sender.username}</strong>}{' '}
                        {t(`texts.${notification.type}`)}
                        {collection && (
                            <>
                                {' '}
                                <strong className={styles.strong}>{collection.name}</strong>
                            </>
                        )}
                    </span>

                    {comment && <span className={styles.quote}>“{comment.text}”</span>}

                    <RelativeTime value={notification.createdAt} className={styles.time} />
                </span>

                {collection?.bannerUrl && (
                    <img
                        className={styles.thumb}
                        src={collection.bannerUrl}
                        alt=""
                        loading="lazy"
                    />
                )}
            </Link>

            {aside}
            {!notification.isRead && variant === 'row' && (
                <span className={styles.dot} aria-label={t('unread')} />
            )}
        </article>
    );
}
