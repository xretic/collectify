'use client';

import { Loader } from '@/components/ui/Loader';
import { useUser } from '@/context/UserProvider';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { ChatInResponse } from '@/types/ChatInResponse';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './chats.module.css';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ChatPage from '@/components/features/chats/ChatPage';
import { CHATS_PAGE_LENGTH, MAX_PREVIEW_MESSAGE_LENGTH } from '@/lib/constans';
import { io, Socket } from 'socket.io-client';
import { MessageInResponse } from '@/types/ChatInResponse';

type SocketMessage = MessageInResponse & { chatId: number };

export default function ChatsPage() {
    const { user, loading, refreshUser } = useUser();

    const [chats, setChats] = useState<ChatInResponse[]>([]);
    const [skip, setSkip] = useState(0);
    const [total, setTotal] = useState(0);

    const socketRef = useRef<Socket | null>(null);
    const joinedChatsRef = useRef<Set<number>>(new Set());
    const [socketReady, setSocketReady] = useState(false);

    const [activeChatId, setActiveChatId] = useState<number | null>(null);

    const { startLoading, stopLoading } = useUIStore();

    const getChats = async (): Promise<void> => {
        startLoading();

        try {
            const data = await api
                .get('api/chats', {
                    searchParams: { skip: skip * CHATS_PAGE_LENGTH },
                })
                .json<{ data: ChatInResponse[]; total: number }>();

            setChats(data.data);
            setTotal(data.total);
        } catch {
            return;
        } finally {
            stopLoading();
        }
    };

    const handleChangeChat = async (chat: ChatInResponse): Promise<void> => {
        startLoading();
        setActiveChatId(chat.id);
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));

        try {
            await api.patch('api/chats/' + chat.id);
            await refreshUser();
        } catch {
            return;
        } finally {
            stopLoading();
        }
    };
    useEffect(() => {
        if (loading || !user) return;

        fetch('/api/socketio');

        const socket = io({ path: '/api/socketio' });
        socketRef.current = socket;

        const onConnect = () => setSocketReady(true);
        const onDisconnect = () => setSocketReady(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        socket.on('message:new', (msg: SocketMessage) => {
            setChats((prev) => {
                const idx = prev.findIndex((c) => c.id === msg.chatId);
                if (idx === -1) return prev;

                const updated = { ...prev[idx] };

                updated.previewContent = msg.content;

                if (msg.userId !== user.id && activeChatId !== msg.chatId) {
                    updated.unread = (updated.unread ?? 0) + 1;
                }

                if (activeChatId === msg.chatId) {
                    updated.unread = 0;
                }

                const next = prev.slice();
                next.splice(idx, 1);
                next.unshift(updated);
                return next;
            });
        });

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.disconnect();
            socketRef.current = null;
            joinedChatsRef.current = new Set();
            setSocketReady(false);
        };
    }, [loading, user?.id, activeChatId]);

    useEffect(() => {
        if (!socketReady) return;

        const socket = socketRef.current;
        if (!socket) return;

        for (const c of chats) {
            if (!joinedChatsRef.current.has(c.id)) {
                socket.emit('chat:join', c.id);
                joinedChatsRef.current.add(c.id);
            }
        }
    }, [socketReady, chats]);

    useEffect(() => {
        if (loading) return;

        getChats();
    }, [loading, skip]);

    if (loading) return <Loader />;

    return (
        <div className={styles.page}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}>Chats</span>

                    <Box className={styles.sidebarActions}>
                        <IconButton
                            className={styles.smallBtn}
                            onClick={() => setSkip(skip - 1)}
                            disabled={skip === 0}
                        >
                            <KeyboardArrowLeftIcon sx={{ color: '#afafaf' }} />
                        </IconButton>

                        <IconButton
                            className={styles.smallBtn}
                            onClick={() => setSkip(skip + 1)}
                            disabled={chats.length === 0 || (skip + 1) * CHATS_PAGE_LENGTH > total}
                        >
                            <KeyboardArrowRightIcon sx={{ color: '#afafaf' }} />
                        </IconButton>
                    </Box>
                </div>

                <div className={styles.chatList}>
                    {chats.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Typography className={styles.emptyTitle}>No chats yet</Typography>
                        </div>
                    ) : (
                        chats.map((c) => {
                            const isActive = c.id === activeChatId;

                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`${styles.chatItem} ${isActive ? styles.chatItemActive : ''}`}
                                    onClick={() => handleChangeChat(c)}
                                >
                                    <Avatar
                                        className={styles.avatar}
                                        src={c.userAvatarUrl}
                                        alt={c.username}
                                    />

                                    <div className={styles.chatMeta}>
                                        <div className={styles.chatTopRow}>
                                            <span className={styles.username}>{c.username}</span>
                                        </div>

                                        <span className={styles.preview}>
                                            {c.previewContent?.length &&
                                            c.previewContent.length > MAX_PREVIEW_MESSAGE_LENGTH
                                                ? c.previewContent.slice(
                                                      0,
                                                      MAX_PREVIEW_MESSAGE_LENGTH - 3,
                                                  ) + '...'
                                                : c.previewContent}
                                        </span>
                                    </div>

                                    {c.unread > 0 && (
                                        <span className={styles.badge}>{c.unread}</span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </aside>

            <ChatPage chatId={activeChatId} />
        </div>
    );
}
