'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import { useIsOnline, useSyncPresence } from '@/entities/chat/model/presenceStore';
import { useIsTyping } from '@/entities/chat/model/typingStore';
import { layoutMessages } from '@/entities/chat/lib/layoutMessages';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { MessageBubble } from '@/entities/chat/ui/MessageBubble';
import type { SessionUser } from '@/entities/user/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { useActiveChatStore } from '@/features/chat/model/activeChatStore';
import { MessageComposer } from '@/features/chat/send/ui/MessageComposer';
import { EmptyState } from '@/shared/ui/EmptyState';
import { RelativeTime } from '@/shared/ui/RelativeTime';
import { Spinner } from '@/shared/ui/Spinner';
import { formatChatTimestamp } from '@/shared/lib/format/date';
import { ChatHeader, ChatIntro } from './ChatHeader';
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
    const { chat, messages, query, append, removeMessage, setSeen } = useChatMessages(chatId);

    const peer = chat?.user ?? null;
    const peers = useMemo(() => (peer ? [peer] : undefined), [peer]);
    useSyncPresence(peers, query.dataUpdatedAt);
    const online = useIsOnline(peer);
    const typing = useIsTyping(chatId);

    const rows = useMemo(() => layoutMessages(messages), [messages]);
    const lastMessage = messages.at(-1);
    const lastIsOwn = lastMessage?.author.id === viewer.id;
    const seen =
        lastIsOwn && chat?.seen && chat.seen.messageId >= lastMessage.id ? chat.seen : null;

    const listRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef({ initialised: false, stickToBottom: true, heightBeforeOlder: 0 });

    // Only a visible tab counts as "seen". Background bookkeeping: a failure (e.g. the chat
    // no longer exists) must not break the page; the messages query shows "not available".
    const markRead = () => {
        if (document.visibilityState !== 'visible') return;

        chatApi
            .markAsRead(chatId)
            .then(() => queryClient.invalidateQueries({ queryKey: sessionUserQueryKey }))
            .catch(() => undefined);
    };

    const onChatShown = useEffectEvent(() => markRead());

    useEffect(() => {
        setActiveChatId(chatId);
        onChatShown();

        const handleVisibility = () => onChatShown();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            setActiveChatId(null);
        };
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

    useRealtimeEvent('chat:read', ({ chatId: readChatId, readerId, messageId, readAt }) => {
        if (readChatId === chatId && readerId !== viewer.id) setSeen({ messageId, readAt });
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

    // The "Seen" line appears under the last message: keep it in view when already at the bottom.
    useLayoutEffect(() => {
        const list = listRef.current;
        if (list && list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX) {
            list.scrollTop = list.scrollHeight;
        }
    }, [seen?.messageId]);

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

    return (
        <section className={styles.window} aria-label="Conversation">
            <ChatHeader
                peer={peer}
                deleted={chat !== null && !peer}
                online={online}
                typing={typing}
            />

            {query.isError ? (
                <div className={styles.messages}>
                    <EmptyState title="This chat is not available." />
                </div>
            ) : (
                <div className={styles.messages} ref={listRef} onScroll={handleScroll}>
                    <div className={styles.thread}>
                        {query.isPending && <Spinner />}
                        {query.isFetchingNextPage && <Spinner size={20} />}

                        {!query.isPending && !query.hasNextPage && peer && (
                            <ChatIntro peer={peer} />
                        )}

                        {rows.map(({ message, position, showTimestamp }) => (
                            <div key={message.id}>
                                {showTimestamp && (
                                    <time
                                        className={styles.timestamp}
                                        dateTime={message.createdAt}
                                        suppressHydrationWarning
                                    >
                                        {formatChatTimestamp(message.createdAt)}
                                    </time>
                                )}

                                <MessageBubble
                                    message={message}
                                    own={message.author.id === viewer.id}
                                    position={position}
                                />
                            </div>
                        ))}

                        {lastIsOwn && (
                            <p
                                className={`${styles.receipt} ${seen ? styles.receiptSeen : ''}`}
                                aria-live="polite"
                            >
                                {seen ? (
                                    <>
                                        <DoneAllRoundedIcon className={styles.receiptIcon} />
                                        Seen <RelativeTime value={seen.readAt} />
                                    </>
                                ) : (
                                    <>
                                        <DoneRoundedIcon className={styles.receiptIcon} />
                                        Sent
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <MessageComposer
                sendMessage={(content) => chatApi.send(chatId, content)}
                restriction={viewer.restrictions.messenger}
                disabled={query.isError || (chat !== null && !chat.user)}
                onSent={handleSent}
                onTyping={() => void chatApi.typing(chatId).catch(() => undefined)}
            />
        </section>
    );
}
