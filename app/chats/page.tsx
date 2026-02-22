'use client';

import { Loader } from '@/components/ui/Loader';
import { useUser } from '@/context/UserProvider';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { ChatInResponse, MessageInResponse } from '@/types/ChatInResponse';
import { useEffect, useRef, useState } from 'react';
import styles from './chats.module.css';
import { Avatar, Box, Button, IconButton, useMediaQuery } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ChatPage from '@/components/features/chats/ChatPage';
import { CHATS_PAGE_LENGTH, MAX_PREVIEW_MESSAGE_LENGTH } from '@/lib/constans';
import { useSocket } from '@/context/SocketProvider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

type SocketMessage = MessageInResponse & { chatId: number };

interface ChatPageProps {
    chatId?: number;
}

export default function ChatsPage({ chatId }: ChatPageProps) {
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
    const skipRef = useRef(0);

    const isMobile = useMediaQuery('(max-width:1000px)');

    useEffect(() => {
        skipRef.current = skip;
    }, [skip]);

    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    useEffect(() => {
        if (!chatId) return;
        if (activeChatIdRef.current === chatId) return;
        setActiveChatId(chatId);
    }, [chatId]);

    const getChats = async (): Promise<void> => {
        if (fetchingChatsRef.current) return;
        fetchingChatsRef.current = true;

        startLoading();
        try {
            const data = await api
                .get('api/chats', {
                    searchParams: { skip: skipRef.current * CHATS_PAGE_LENGTH },
                })
                .json<{ data: ChatInResponse[]; total: number }>();

            setChats(data.data);
            setTotal(data.total);
        } catch {
            return;
        } finally {
            stopLoading();
            fetchingChatsRef.current = false;
        }
    };

    const handleChangeChat = (id: number, unread?: number): void => {
        setActiveChatId(id);
        setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));

        if (unread && unread > 0) {
            void (async () => {
                try {
                    await api.patch('api/chats/' + id);
                    await refreshUser();
                } catch {
                    return;
                }
            })();
        }
    };

    const handleBackToChats = (): void => {
        setActiveChatId(null);
    };

    useEffect(() => {
        if (loading) return;
        void getChats();
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
            {isMobile && activeChatId ? (
                <Button
                    onClick={handleBackToChats}
                    sx={{ textTransform: 'none', marginRight: 'auto', color: 'var(--text-color)' }}
                >
                    <ArrowBackIcon />
                    <span className={styles.backButton}>Chats</span>
                </Button>
            ) : (
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <span className={styles.sidebarTitle}>Chats</span>

                        <Box className={styles.sidebarActions}>
                            <IconButton
                                className={styles.smallBtn}
                                onClick={() => setSkip((s) => s - 1)}
                                disabled={skip === 0}
                            >
                                <KeyboardArrowLeftIcon sx={{ color: '#afafaf' }} />
                            </IconButton>

                            <IconButton
                                className={styles.smallBtn}
                                onClick={() => setSkip((s) => s + 1)}
                                disabled={
                                    chats.length === 0 || (skip + 1) * CHATS_PAGE_LENGTH > total
                                }
                            >
                                <KeyboardArrowRightIcon sx={{ color: '#afafaf' }} />
                            </IconButton>
                        </Box>
                    </div>

                    <div className={styles.chatList}>
                        {chats.length === 0 ? (
                            <p className={styles.emptyTitle}>No chats yet</p>
                        ) : (
                            chats.map((c) => {
                                const isActive = c.id === activeChatId;

                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`${styles.chatItem} ${
                                            isActive ? styles.chatItemActive : ''
                                        }`}
                                        onClick={() => handleChangeChat(c.id, c.unread)}
                                    >
                                        <Avatar
                                            className={styles.avatar}
                                            src={c.userAvatarUrl}
                                            alt={c.username}
                                        />

                                        <div className={styles.chatMeta}>
                                            <div className={styles.chatTopRow}>
                                                <span className={styles.username}>
                                                    {c.username}
                                                </span>
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
            )}

            {isMobile && !activeChatId ? null : (
                <ChatPage key={activeChatId ?? 'none'} chatId={activeChatId} />
            )}
        </div>
    );
}
