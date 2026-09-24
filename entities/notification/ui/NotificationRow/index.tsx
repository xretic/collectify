import Link from 'next/link';
import { Avatar, Badge } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CommentIcon from '@mui/icons-material/Comment';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import { NOTIFICATION_TEXTS, type AppNotification, type NotificationType } from '../../model/types';
import styles from './index.module.css';

const ICONS: Record<NotificationType, { Icon: SvgIconComponent; className: string }> = {
    LIKE: { Icon: FavoriteIcon, className: styles.like },
    FAVORITE: { Icon: BookmarkIcon, className: styles.favorite },
    COMMENT: { Icon: CommentIcon, className: styles.accent },
    FOLLOW: { Icon: PersonAddAlt1Icon, className: styles.accent },
    REPORT_RESOLVED: { Icon: ShieldOutlinedIcon, className: styles.accent },
    SANCTION: { Icon: GavelIcon, className: styles.like },
};

export function NotificationRow({ notification }: { notification: AppNotification }) {
    const { Icon, className } = ICONS[notification.type];
    const { sender, collection } = notification;

    return (
        <article className={`${styles.row} ${notification.isRead ? '' : styles.unread}`}>
            <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                    <span className={styles.typeIcon}>
                        <Icon className={className} />
                    </span>
                }
            >
                <Avatar
                    className={styles.avatar}
                    src={sender?.avatarUrl}
                    alt={sender?.username ?? 'Collectify'}
                />
            </Badge>

            <p className={styles.content}>
                {sender && (
                    <Link href={`/users/${sender.id}`} className={styles.strong}>
                        {sender.username}
                    </Link>
                )}{' '}
                <span className={styles.text}>{NOTIFICATION_TEXTS[notification.type]}</span>{' '}
                {collection && (
                    <Link href={`/collections/${collection.id}`} className={styles.strong}>
                        {collection.name}
                    </Link>
                )}
            </p>

            <RelativeTime value={notification.createdAt} className={styles.time} />
        </article>
    );
}
