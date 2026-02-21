'use client';

import { Avatar, IconButton } from '@mui/material';
import styles from './index.module.css';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';
import { useUIStore } from '@/stores/uiStore';
import { api } from '@/lib/api';
import { ChatInResponse, MessageInResponse } from '@/types/ChatInResponse';
import MessageComponent from '../Message';
import TextArea from 'antd/es/input/TextArea';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/lib/constans';
import SendIcon from '@mui/icons-material/Send';
import { ConfigProvider } from 'antd';
import { useSocket } from '@/context/SocketProvider';

interface ChatPageProps {
    chatId: number | null;
}

type Cursor = number | null;
type SocketMessage = MessageInResponse & { chatId: number };

export default function ChatPage({ chatId }: ChatPageProps) {
    const [details, setDetails] = useState<ChatInResponse | null>(null);
    const [messageText, setMessageText] = useState('');
    const [cursor, setCursor] = useState<Cursor>(null);
    const [hasMore, setHasMore] = useState(true);

    const { user, loading } = useUser();
    const { startLoading, stopLoading, loadingCount } = useUIStore();
    const socket = useSocket();

    const router = useRouter();
    const messagesRef = useRef<HTMLDivElement>(null);

    const fetchingRef = useRef(false);
    const isFirstLoadRef = useRef(true);
    const isPrependingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const shouldScrollToBottomRef = useRef(false);

    const inputStyle: Record<string, string> = {
        backgroundColor: 'var(--container-color)',
        color: 'var(--text-color)',
        borderColor: 'var(--border-color)',
    };

    const sortAsc = (arr: MessageInResponse[]) =>
        arr
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
                    a.id - b.id,
            );

    const mergeMessages = (prev: MessageInResponse[], incoming: MessageInResponse[]) => {
        const map = new Map<number, MessageInResponse>();
        for (const m of prev) map.set(m.id, m);
        for (const m of incoming) map.set(m.id, m);
        return sortAsc(Array.from(map.values()));
    };

    const getMessages = async (): Promise<void> => {
        if (!chatId || fetchingRef.current || !hasMore) return;
        fetchingRef.current = true;

        startLoading();
        try {
            const container = messagesRef.current;

            if (!isFirstLoadRef.current && container) {
                isPrependingRef.current = true;
                prevScrollHeightRef.current = container.scrollHeight;
            }

            const res = await api
                .get('api/chats/' + chatId, {
                    searchParams: cursor ? { cursor } : {},
                })
                .json<{ data: ChatInResponse; nextCursor: Cursor }>();

            const incoming = sortAsc(res.data.messages ?? []);

            setDetails((prev) => {
                if (!prev) return { ...res.data, messages: incoming };
                return {
                    ...prev,
                    ...res.data,
                    messages: mergeMessages(prev.messages ?? [], incoming),
                };
            });

            setCursor(res.nextCursor);
            setHasMore(res.nextCursor !== null);
        } finally {
            stopLoading();
            fetchingRef.current = false;
        }
    };

    const handleSendMessage = async (): Promise<void> => {
        if (!chatId || !messageText.trim()) return;

        startLoading();
        try {
            const res = await api
                .post('api/chats/' + chatId, { json: { messageText } })
                .json<{ data: MessageInResponse }>();

            const container = messagesRef.current;
            const nearBottom = container
                ? container.scrollHeight - container.scrollTop - container.clientHeight < 120
                : true;

            shouldScrollToBottomRef.current = nearBottom;

            setDetails((prev) => {
                if (!prev) return prev;

                const exists = (prev.messages ?? []).some((m) => m.id === res.data.id);
                if (exists) return prev;

                return { ...prev, messages: [...(prev.messages ?? []), res.data] };
            });

            setMessageText('');
        } finally {
            stopLoading();
        }
    };

    useLayoutEffect(() => {
        const container = messagesRef.current;
        if (!container) return;

        if (isPrependingRef.current) {
            const prevH = prevScrollHeightRef.current;
            isPrependingRef.current = false;
            container.scrollTop = container.scrollHeight - prevH;
            return;
        }

        if (isFirstLoadRef.current && (details?.messages?.length ?? 0) > 0) {
            isFirstLoadRef.current = false;
            container.scrollTop = container.scrollHeight;
            return;
        }

        if (shouldScrollToBottomRef.current) {
            shouldScrollToBottomRef.current = false;
            const isNearBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 120;
            if (isNearBottom) container.scrollTop = container.scrollHeight;
        }
    }, [details?.messages?.length]);

    useEffect(() => {
        if (loading || !chatId) return;
        getMessages();
    }, [loading, chatId]);

    useEffect(() => {
        setDetails(null);
        setCursor(null);
        setHasMore(true);
        isFirstLoadRef.current = true;
        isPrependingRef.current = false;
        shouldScrollToBottomRef.current = false;
        prevScrollHeightRef.current = 0;
        fetchingRef.current = false;
    }, [chatId]);

    useEffect(() => {
        const container = messagesRef.current;
        if (!container) return;

        const onScroll = () => {
            if (container.scrollTop <= 10 && !fetchingRef.current && hasMore) getMessages();
        };

        container.addEventListener('scroll', onScroll);
        return () => container.removeEventListener('scroll', onScroll);
    }, [hasMore, chatId, cursor]);

    useEffect(() => {
        if (!socket || !chatId) return;

        socket.emit('chat:join', chatId);

        const onNew = (msg: SocketMessage) => {
            if (msg.chatId !== chatId) return;

            setDetails((prev) => {
                if (!prev) return prev;

                const exists = (prev.messages ?? []).some((m) => m.id === msg.id);
                if (exists) return prev;

                const container = messagesRef.current;
                const nearBottom = container
                    ? container.scrollHeight - container.scrollTop - container.clientHeight < 120
                    : true;

                shouldScrollToBottomRef.current = nearBottom;

                return { ...prev, messages: [...(prev.messages ?? []), msg] };
            });
        };

        socket.on('message:new', onNew);

        return () => {
            socket.off('message:new', onNew);
            socket.emit('chat:leave', chatId);
        };
    }, [socket, chatId]);

    if (!user) return null;

    return (
        <main className={styles.content}>
            <div className={styles.box}>
                <header className={styles.contentHeader}>
                    {details ? (
                        <div className={styles.contentHeaderInner}>
                            <Avatar
                                className={styles.activeAvatar}
                                src={details.userAvatarUrl ?? ''}
                                alt={details.username ?? ''}
                            />
                            <div>
                                <span
                                    onClick={() => router.replace('/users/' + details.userId)}
                                    className={styles.activeTitle}
                                >
                                    {details.username}
                                </span>
                                <p className={styles.activeSubtitle}>Direct messages</p>
                            </div>
                        </div>
                    ) : (
                        <span className={styles.activeTitle}>Select a chat</span>
                    )}
                </header>

                <section className={styles.messagesBox} ref={messagesRef}>
                    {(!chatId || (details && (details.messages?.length ?? 0) === 0)) && (
                        <div className={styles.messagesPlaceholder}>
                            <span className={styles.placeholderTitle}>
                                {!chatId && 'Pick a chat from the left'}
                                {details && details.messages?.length === 0 && 'No messages yet'}
                            </span>
                            <span className={styles.placeholderText}>
                                {details?.messages?.length === 0 &&
                                    'Start the conversation by sending the first message.'}
                                {!chatId && 'Your conversations will show up here.'}
                            </span>
                        </div>
                    )}

                    {details?.messages?.map((x) => (
                        <MessageComponent
                            key={x.id}
                            id={x.id}
                            senderAvatarUrl={x.userAvatarUrl}
                            senderUsername={x.username}
                            senderId={x.userId}
                            content={x.content}
                            createdAt={x.createdAt}
                        />
                    ))}
                </section>

                {details && (
                    <ConfigProvider
                        theme={{
                            token: {
                                colorTextPlaceholder: 'var(--soft-text)',
                                colorIcon: 'var(--soft-text)',
                            },
                        }}
                    >
                        <footer className={styles.composer}>
                            <div className={styles.composerInputWrap}>
                                <TextArea
                                    value={messageText}
                                    maxLength={DIRECT_MESSAGE_MAX_LENGTH}
                                    placeholder="Write your message"
                                    disabled={loadingCount > 0}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    style={{
                                        height: 50,
                                        resize: 'none',
                                        ...inputStyle,
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />

                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={loadingCount > 0 || !messageText.trim()}
                                    color="inherit"
                                >
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </footer>
                    </ConfigProvider>
                )}
            </div>
        </main>
    );
}
