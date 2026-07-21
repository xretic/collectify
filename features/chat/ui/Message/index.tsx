import { Avatar, IconButton, Tooltip } from '@mui/material';
import styles from './index.module.css';
import { useUser } from '@/entities/user/model/UserProvider';
import { Loader } from '@/shared/ui/Loader';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useState } from 'react';
import ReportDialog from '@/features/report/create/ui/ReportDialog';

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
    const [reportOpen, setReportOpen] = useState(false);

    const timeLabel = moment(createdAt).from(nowTick);

    if (!user) return <Loader />;

    return (
        <>
            <div className={styles.box}>
                <Avatar src={senderAvatarUrl} alt="avatar" sx={{ width: 35, height: 35 }} />

                <span className={styles.body}>
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

                {senderId !== user.id && (
                    <Tooltip title="Report message">
                        <IconButton
                            className={styles.reportButton}
                            size="small"
                            onClick={() => setReportOpen(true)}
                        >
                            <FlagOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </div>

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetUserId={senderId}
                targetUsername={senderUsername}
                messageId={id}
                messagePreview={content}
            />
        </>
    );
}
