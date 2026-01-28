import { NotificationType } from '@/generated/prisma/enums';
import { Avatar } from '@mui/material';
import Link from 'next/link';
import styles from './Notification.module.css';
import { NOTIFICATION_TEXTS } from '@/lib/constans';
import moment from 'moment';

interface NotificationProps {
    id: number | null;
    username: string | undefined;
    avatarUrl: string | undefined;
    isRead: boolean;
    type: NotificationType;
    createdAt: Date;
}

export default function Notification({
    id,
    username,
    avatarUrl,
    isRead,
    type,
    createdAt,
}: NotificationProps) {
    return (
        <div className={`${styles.notification} ${!isRead ? styles.unread : ''}`}>
            <Link href={`/users/${id}`} className={styles.link}>
                <Avatar className={styles.avatar} src={avatarUrl} alt={username} />
                <div className={styles.content}>
                    <span className={styles.username}>{username}</span>
                    <span className={styles.text}>{NOTIFICATION_TEXTS[type]}</span>
                </div>
                <span className={styles.time}>{moment(createdAt).fromNow()}</span>
            </Link>
        </div>
    );
}
