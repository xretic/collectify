import { Skeleton } from '@mui/material';
import styles from '../../../app/chats/chats.module.css';
import { CHATS_PAGE_LENGTH } from '@/lib/constans';

export default function ChatListSkeleton() {
    return (
        <>
            {Array.from({ length: CHATS_PAGE_LENGTH }).map((_, index) => (
                <div key={index} className={styles.chatItemNoHover}>
                    <Skeleton variant="circular" width={40} height={40} />

                    <div className={styles.chatMeta}>
                        <div className={styles.chatTopRow}>
                            <span className={styles.username}>
                                <Skeleton width={75} />
                            </span>
                        </div>

                        <span className={styles.preview}>
                            <Skeleton width={200} />
                        </span>
                    </div>
                </div>
            ))}
        </>
    );
}
