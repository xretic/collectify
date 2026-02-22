import { Avatar } from '@mui/material';
import styles from './index.module.css';
import { useUser } from '@/context/UserProvider';
import { Loader } from '@/components/ui/Loader';
import moment from 'moment';
import { useRouter } from 'next/navigation';

interface MessageProps {
    id: number;
    senderAvatarUrl: string;
    senderUsername: string;
    senderId: number;
    content: string;
    createdAt: Date;
    nowTick: number;
}

export default function MessageComponent({
    id,
    senderAvatarUrl,
    senderUsername,
    senderId,
    content,
    createdAt,
    nowTick,
}: MessageProps) {
    const { user } = useUser();
    const router = useRouter();

    const timeLabel = moment(createdAt).from(nowTick);

    if (!user) return <Loader />;

    return (
        <div className={styles.box}>
            <Avatar src={senderAvatarUrl} alt="avatar" sx={{ width: 35, height: 35 }} />

            <span>
                <p>
                    <span
                        onClick={() => router.replace('/users/' + senderId)}
                        className={styles.username}
                    >
                        {senderUsername}
                    </span>
                    <span className={styles.date}>{timeLabel}</span>
                </p>
                <p className={styles.content}>{content}</p>
            </span>
        </div>
    );
}
