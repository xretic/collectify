import { NotificationType } from '@/generated/prisma/enums';
import { Avatar, Badge } from '@mui/material';
import styles from './Notification.module.css';
import { NOTIFICATION_TEXTS } from '@/lib/constans';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import { SvgIconComponent } from '@mui/icons-material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CommentIcon from '@mui/icons-material/Comment';

interface NotificationProps {
    id: number | null;
    username: string | undefined;
    avatarUrl: string | undefined;
    isRead: boolean;
    type: NotificationType;
    createdAt: Date;
    collectionName: string | null;
    collectionId: number | null;
    unreadCount: number;
}

type NotificationIconConfig = {
    Icon: SvgIconComponent;
    color: string;
};

const typeIcons: Record<NotificationType, NotificationIconConfig> = {
    LIKE: {
        Icon: FavoriteIcon,
        color: '#ff4747',
    },
    FAVORITE: {
        Icon: BookmarkIcon,
        color: '#ffce5d',
    },
    COMMENT: {
        Icon: CommentIcon,
        color: '#208fff',
    },
    FOLLOW: {
        Icon: PersonAddAlt1Icon,
        color: '#208fff',
    },
};

export default function Notification({
    id,
    username,
    avatarUrl,
    isRead,
    type,
    createdAt,
    collectionName,
    collectionId,
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

    const { Icon, color } = typeIcons[type];

    return (
        <div className={`${styles.notification} ${!isRead ? styles.unread : ''}`}>
            <button onClick={handleClick} className={styles.button}>
                <Badge
                    badgeContent={<Icon fontSize="small" sx={{ color, width: 20, height: 20 }} />}
                    color="default"
                    overlap="circular"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                >
                    <Avatar className={styles.avatar} src={avatarUrl} alt={username} />
                </Badge>
                <div className={styles.content}>
                    <span className={styles.username}>{username}</span>
                    <span className={styles.text}>{NOTIFICATION_TEXTS[type]}</span>
                    <span
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.replace('/collections/' + collectionId);
                        }}
                        className={styles.collection}
                    >
                        {collectionName ? collectionName : ''}
                    </span>
                </div>
                <span className={styles.time}>{moment(createdAt).fromNow()}</span>
            </button>
        </div>
    );
}
