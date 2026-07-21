'use client';

import styles from '@/app/management/management.module.css';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { Avatar, Button } from '@mui/material';
import { ManagementMessageHistory } from '@/entities/management/api/managementApi';
import { formatDateTime } from '../lib/format';

type MessageHistoryProps = {
    busy: boolean;
    messageHistory: ManagementMessageHistory;
    messageNextSkip: number | null;
    setHistoryOpen: (value: boolean) => void;
    onLoadMoreMessages: () => void;
};

export function MessageHistory({
    busy,
    messageHistory,
    messageNextSkip,
    setHistoryOpen,
    onLoadMoreMessages,
}: MessageHistoryProps) {
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                    @{messageHistory.user.username} conversations
                </h3>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setHistoryOpen(false)}
                    sx={{ textTransform: 'none' }}
                >
                    Hide
                </Button>
            </div>

            <div className={styles.historyList}>
                {messageHistory.chats.length === 0 ? (
                    <span className={styles.emptyState}>No messages yet</span>
                ) : (
                    <>
                        {messageHistory.chats.map((chat) => {
                            const otherUsers = chat.users.filter(
                                (chatUser) => chatUser.id !== messageHistory.user.id,
                            );

                            return (
                                <div key={chat.id} className={styles.historyChat}>
                                    <div className={styles.historyChatHeader}>
                                        <ChatBubbleOutlineOutlinedIcon fontSize="small" />
                                        <span>
                                            Chat #{chat.id} with{' '}
                                            {otherUsers
                                                .map((chatUser) => chatUser.username)
                                                .join(', ') || 'unknown'}
                                        </span>
                                    </div>

                                    <div className={styles.historyMessages}>
                                        {chat.messages.map((message) => (
                                            <div key={message.id} className={styles.historyMessage}>
                                                <Avatar
                                                    src={message.userAvatarUrl}
                                                    alt={message.username}
                                                    sx={{ width: 28, height: 28 }}
                                                />
                                                <div>
                                                    <span className={styles.username}>
                                                        {message.username}
                                                    </span>
                                                    <span className={styles.muted}>
                                                        {' '}
                                                        {formatDateTime(message.createdAt)}
                                                    </span>
                                                    <p>{message.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {messageNextSkip !== null && (
                            <Button
                                variant="outlined"
                                disabled={busy}
                                onClick={onLoadMoreMessages}
                                sx={{ textTransform: 'none' }}
                            >
                                Load more chats
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
