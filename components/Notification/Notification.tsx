import { NotificationType } from '@/generated/prisma/enums';
import { Avatar } from '@mui/material';
import Link from 'next/link';
import styles from './Notification.module.css';
import { NOTIFICATION_TEXTS } from '@/lib/constans';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';

interface NotificationProps {
    id: number | null;
    username: string | undefined;
    avatarUrl: string | undefined;
    isRead: boolean;
    type: NotificationType;
    createdAt: Date;
    collectionName: string | null;
    unreadCount: number;
}

export default function Notification({
    id,
    username,
    avatarUrl,
    isRead,
    type,
    createdAt,
    collectionName,
    unreadCount,
}: NotificationProps) {
    const router = useRouter();
    const { refreshUser } = useUser();

    const handleClick = async () => {
        if (unreadCount > 0) {
            fetch('/api/notifications', {
                method: 'PATCH',
            });
        }

        await refreshUser();

        router.replace('/users/' + id);
    };

    return (
        <div className={`${styles.notification} ${!isRead ? styles.unread : ''}`}>
            <button onClick={handleClick} className={styles.button}>
                <Avatar className={styles.avatar} src={avatarUrl} alt={username} />
                <div className={styles.content}>
                    <span className={styles.username}>{username}</span>
                    <span className={styles.text}>{NOTIFICATION_TEXTS[type]}</span>
                    <span className={styles.collection}>
                        {collectionName ? collectionName : ''}
                    </span>
                </div>
                <span className={styles.time}>{moment(createdAt).fromNow()}</span>
            </button>
        </div>
    );
}
