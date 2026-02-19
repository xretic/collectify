'use client';

import { Loader } from '@/components/ui/Loader';
import { useUser } from '@/context/UserProvider';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { ChatInResponse } from '@/types/ChatInResponse';
import { useEffect, useMemo, useState } from 'react';
import styles from './chats.module.css';
import { Box, Button, Typography } from '@mui/material';

export default function ChatsPage() {
    const { loading } = useUser();

    const [chats, setChats] = useState<ChatInResponse[]>([]);
    const [skip, setSkip] = useState(0);

    const [activeChatId, setActiveChatId] = useState<number | null>(null);

    const { startLoading, stopLoading } = useUIStore();

    const activeChat = useMemo(
        () => chats.find((c) => c.id === activeChatId) ?? null,
        [chats, activeChatId],
    );

    const getChats = async (): Promise<void> => {
        startLoading();

        try {
            const data = await api
                .get('api/chats', {
                    searchParams: { skip: String(skip) },
                })
                .json<{ data: ChatInResponse[] }>();

            setChats(data.data);

            if (data.data.length > 0 && activeChatId === null) {
                setActiveChatId(data.data[0].id);
            }
        } catch {
            return;
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (loading) return;
        getChats();
    }, [loading, skip]);

    if (loading) return <Loader />;

    return (
        <div className={styles.page}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Typography className={styles.sidebarTitle}>Messages</Typography>

                    <Box className={styles.sidebarActions}>
                        <Button
                            size="small"
                            variant="outlined"
                            className={styles.smallBtn}
                            onClick={() => setSkip((s) => Math.max(0, s - 20))}
                            disabled={skip === 0}
                        >
                            Prev
                        </Button>

                        <Button
                            size="small"
                            variant="outlined"
                            className={styles.smallBtn}
                            onClick={() => setSkip((s) => s + 20)}
                            disabled={chats.length === 0}
                        >
                            Next
                        </Button>
                    </Box>
                </div>

                <div className={styles.chatList}>
                    {chats.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Typography className={styles.emptyTitle}>No chats yet</Typography>
                            <Typography className={styles.emptyText}>
                                When you start a conversation, it will appear here.
                            </Typography>
                        </div>
                    ) : (
                        chats.map((c) => {
                            const isActive = c.id === activeChatId;

                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ''}`}
                                    onClick={() => setActiveChatId(c.id)}
                                >
                                    <img
                                        className={styles.avatar}
                                        src={c.userAvatarUrl || '/images/default-avatar.png'}
                                        alt={c.username}
                                        loading="lazy"
                                    />

                                    <div className={styles.chatMeta}>
                                        <div className={styles.chatTopRow}>
                                            <span className={styles.username}>{c.username}</span>
                                        </div>

                                        <span className={styles.preview}>{c.previewContent}</span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            <main className={styles.content}>
                <header className={styles.contentHeader}>
                    {activeChat ? (
                        <div className={styles.contentHeaderInner}>
                            <img
                                className={styles.activeAvatar}
                                src={activeChat.userAvatarUrl || '/images/default-avatar.png'}
                                alt={activeChat.username}
                            />
                            <div>
                                <Typography className={styles.activeTitle}>
                                    {activeChat.username}
                                </Typography>
                                <Typography className={styles.activeSubtitle}>
                                    Direct messages
                                </Typography>
                            </div>
                        </div>
                    ) : (
                        <Typography className={styles.activeTitle}>Select a chat</Typography>
                    )}
                </header>

                <section className={styles.messagesBox}>
                    <div className={styles.messagesPlaceholder}>
                        <Typography className={styles.placeholderTitle}>
                            {activeChat ? 'No messages yet' : 'Pick a chat from the left'}
                        </Typography>
                        <Typography className={styles.placeholderText}>
                            {activeChat
                                ? 'Start the conversation by sending the first message.'
                                : 'Your conversations will show up here.'}
                        </Typography>
                    </div>
                </section>

                <footer className={styles.composer}>
                    <div className={styles.composerDisabled}>Message input (coming next)</div>
                </footer>
            </main>
        </div>
    );
}
