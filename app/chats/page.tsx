'use client';

import { Loader } from '@/components/ui/Loader';
import { useUser } from '@/context/UserProvider';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { ChatInResponse, MessageInResponse } from '@/types/ChatInResponse';
import { useEffect, useRef, useState } from 'react';
import styles from './chats.module.css';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ChatPage from '@/components/features/chats/ChatPage';
import { CHATS_PAGE_LENGTH, MAX_PREVIEW_MESSAGE_LENGTH } from '@/lib/constans';
import { useSocket } from '@/context/SocketProvider';

type SocketMessage = MessageInResponse & { chatId: number };

export default function ChatsPage() {
    const { user, loading, refreshUser } = useUser();
    const { startLoading, stopLoading } = useUIStore();
    const socket = useSocket();

    const [chats, setChats] = useState<ChatInResponse[]>([]);
    const [skip, setSkip] = useState(0);
    const [total, setTotal] = useState(0);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);

    const activeChatIdRef = useRef<number | null>(null);
    const joinedChatsRef = useRef<Set<number>>(new Set());
    const fetchingChatsRef = useRef(false);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    const getChats = async (): Promise<void> => {
        if (fetchingChatsRef.current) return;
        fetchingChatsRef.current = true;

        startLoading();
        try {
            const data = await api
                .get('api/chats', {
                    searchParams: { skip: skip * CHATS_PAGE_LENGTH },
                })
                .json<{ data: ChatInResponse[]; total: number }>();

            setChats(data.data);
            setTotal(data.total);
        } finally {
            stopLoading();
            fetchingChatsRef.current = false;
        }
    };

    const handleChangeChat = async (chat: ChatInResponse): Promise<void> => {
        startLoading();
        setActiveChatId(chat.id);
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));

        try {
            await api.patch('api/chats/' + chat.id);
            await refreshUser();
        } finally {
            stopLoading();
        }
    };

    useEffect(() => {
        if (loading) return;
        getChats();
    }, [loading, skip]);

    useEffect(() => {
        if (!socket) return;

        for (const c of chats) {
            if (!joinedChatsRef.current.has(c.id)) {
                socket.emit('chat:join', c.id);
                joinedChatsRef.current.add(c.id);
            }
        }
    }, [socket, chats]);

    useEffect(() => {
        if (!socket || !user) return;

        const onNew = (msg: SocketMessage) => {
            const currentActive = activeChatIdRef.current;

            setChats((prev) => {
                const idx = prev.findIndex((c) => c.id === msg.chatId);

                if (idx === -1) {
                    void getChats();
                    return prev;
                }

                const updated: ChatInResponse = {
                    ...prev[idx],
                    previewContent: msg.content,
                    unread:
                        msg.userId !== user.id && currentActive !== msg.chatId
                            ? (prev[idx].unread ?? 0) + 1
                            : currentActive === msg.chatId
                              ? 0
                              : (prev[idx].unread ?? 0),
                };

                const next = prev.slice();
                next.splice(idx, 1);
                next.unshift(updated);
                return next;
            });
        };

        socket.on('message:new', onNew);

        return () => {
            socket.off('message:new', onNew);
        };
    }, [socket, user?.id]);

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
