'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@mui/material';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import { useRealtimeEvent } from '@/entities/chat/model/RealtimeProvider';
import { MessageBubble } from '@/entities/chat/ui/MessageBubble';
import type { SessionUser } from '@/entities/user/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { useActiveChatStore } from '@/features/chat/model/activeChatStore';
import { MessageComposer } from '@/features/chat/send/ui/MessageComposer';
import { ReportButton } from '@/features/report/create/ui/ReportButton';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { useChatMessages } from './useChatMessages';
import styles from './index.module.css';

const NEAR_BOTTOM_PX = 120;
const LOAD_OLDER_AT_PX = 10;

type ChatWindowProps = {
    chatId: number;
    viewer: SessionUser;
};

export function ChatWindow({ chatId, viewer }: ChatWindowProps) {
    const queryClient = useQueryClient();
    const setActiveChatId = useActiveChatStore((state) => state.setActiveChatId);
    const { chat, messages, query, append, removeMessage } = useChatMessages(chatId);

    const listRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef({ initialised: false, stickToBottom: true, heightBeforeOlder: 0 });

    // Background bookkeeping: a failure (e.g. the chat no longer exists) must not break the page;
    // the messages query already shows "not available" in that case.
    const markRead = () => {
        chatApi
            .markAsRead(chatId)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: sessionUserQueryKey });
                queryClient.invalidateQueries({ queryKey: chatQueryKeys.lists() });
            })
            .catch(() => undefined);
    };

    const onChatOpened = useEffectEvent(() => markRead());

    useEffect(() => {
        setActiveChatId(chatId);
        onChatOpened();
        return () => setActiveChatId(null);
    }, [chatId, setActiveChatId]);

    useRealtimeEvent('message:new', (message) => {
        if (message.chatId !== chatId) return;

        const list = listRef.current;
        scrollRef.current.stickToBottom =
            !list || list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;

        append(message);
        if (message.author.id !== viewer.id) markRead();
    });

    useRealtimeEvent('message:deleted', ({ chatId: deletedFrom, messageId }) => {
        if (deletedFrom === chatId) removeMessage(messageId);
    });

    // Keeps the view anchored: bottom on first load / new messages, same spot when older ones load.
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || messages.length === 0) return;

        const scroll = scrollRef.current;

        if (!scroll.initialised || scroll.stickToBottom) {
            list.scrollTop = list.scrollHeight;
            scroll.initialised = true;
            scroll.stickToBottom = false;
        } else if (scroll.heightBeforeOlder) {
            list.scrollTop = list.scrollHeight - scroll.heightBeforeOlder;
            scroll.heightBeforeOlder = 0;
        }
    }, [messages.length]);

    const handleScroll = () => {
        const list = listRef.current;
        if (!list || list.scrollTop > LOAD_OLDER_AT_PX) return;
        if (!query.hasNextPage || query.isFetchingNextPage) return;

        scrollRef.current.heightBeforeOlder = list.scrollHeight;
        void query.fetchNextPage();
    };

    const handleSent = (message: Parameters<typeof append>[0]) => {
        scrollRef.current.stickToBottom = true;
        append(message);
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.lists() });
    };

    if (query.isError) return <EmptyState title="This chat is not available." />;

    return (
        <main className={styles.window}>
            <header className={styles.header}>
                {chat?.user ? (
                    <Link href={`/users/${chat.user.id}`} className={styles.peer}>
                        <Avatar
                            className={styles.peerAvatar}
                            src={chat.user.avatarUrl}
                            alt={chat.user.username}
                        />
                        <span>
                            <span className={styles.peerName}>{chat.user.username}</span>
                            <span className={styles.peerSubtitle}>Direct messages</span>
                        </span>
                    </Link>
                ) : (
                    <span className={styles.peerName}>{chat ? 'Deleted account' : ''}</span>
                )}
            </header>

            <div className={styles.messages} ref={listRef} onScroll={handleScroll}>
                {query.isFetchingNextPage && <Spinner size={20} />}
                {query.isPending && <Spinner />}

                {!query.isPending && messages.length === 0 && (
                    <EmptyState title="No messages yet" description="Start the conversation." />
                )}

                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        actions={
                            message.author.id !== viewer.id && (
                                <ReportButton
                                    size="small"
                                    target={{ type: 'MESSAGE', messageId: message.id }}
                                    username={message.author.username}
                                    preview={message.content}
                                />
                            )
                        }
                    />
                ))}
            </div>

            <MessageComposer
                chatId={chatId}
                restriction={viewer.restrictions.messenger}
                disabled={chat !== null && !chat.user}
                onSent={handleSent}
            />
        </main>
    );
}
