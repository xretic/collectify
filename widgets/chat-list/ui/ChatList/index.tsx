'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@mui/material';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import { useSyncPresence } from '@/entities/chat/model/presenceStore';
import { useTypingStore } from '@/entities/chat/model/typingStore';
import { isMuteActive, patchChat, type ChatPages } from '@/entities/chat/model/chatListCache';
import { PeerAvatar } from '@/entities/chat/ui/PeerAvatar';
import { TypingIndicator } from '@/entities/chat/ui/TypingIndicator';
import { ChatMuteMenu } from '@/features/chat/mute/ui/ChatMuteMenu';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { useNow } from '@/shared/lib/hooks/useNow';
import { formatShortRelative } from '@/shared/lib/format/date';
import styles from './index.module.css';

/** Missed realtime events are caught up by refetching. */
const REFRESH_MS = 60_000;
const SKELETON_ROWS = 8;

type ChatListProps = {
    activeChatId: number | null;
    viewer: { id: number; username: string };
};

export function ChatList({ activeChatId, viewer }: ChatListProps) {
    const queryClient = useQueryClient();
    const key = chatQueryKeys.lists();
    const now = useNow();
    const typingChats = useTypingStore((state) => state.typing);

    const query = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => chatApi.list(pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => {
            const loaded = pages.reduce((count, page) => count + page.data.length, 0);
            return loaded < lastPage.total ? loaded : undefined;
        },
        refetchInterval: REFRESH_MS,
    });

    // Offsets shift while chats move to the top, so a chat can come twice.
    const chats = useMemo(() => {
        const seen = new Set<number>();
        return (query.data?.pages ?? [])
            .flatMap((page) => page.data)
            .filter((chat) => !seen.has(chat.id) && seen.add(chat.id));
    }, [query.data]);

    const totalUnread = chats.reduce(
        (sum, chat) => sum + (chat.id === activeChatId ? 0 : chat.unread),
        0,
    );

    const peers = useMemo(() => chats.map((chat) => chat.user), [chats]);
    useSyncPresence(peers, query.dataUpdatedAt);

    const loadMoreRef = useInfiniteScroll({
        hasMore: query.hasNextPage,
        loading: query.isFetchingNextPage,
        onLoadMore: () => void query.fetchNextPage(),
        rootMargin: '200px 0px',
    });

    // Move the chat to the top with the new preview; unknown chats trigger a refetch.
    useRealtimeEvent('message:new', (message) => {
        const data = queryClient.getQueryData<ChatPages>(key);
        const known = data?.pages.some((page) => page.data.some((c) => c.id === message.chatId));

        if (!data || !known) {
            queryClient.invalidateQueries({ queryKey: key });
            return;
        }

        // An open chat reads it right away, unless the tab is in the background.
        const incoming =
            message.author.id !== viewer.id &&
            (message.chatId !== activeChatId || document.visibilityState !== 'visible');

        queryClient.setQueryData<ChatPages>(key, (current) =>
            current
                ? patchChat(
                      current,
                      message.chatId,
                      (chat) => ({
                          ...chat,
                          unread: incoming ? chat.unread + 1 : chat.unread,
                          lastMessage: {
                              content: message.content,
                              createdAt: message.createdAt,
                              authorId: message.author.id,
                          },
                          lastMessageAt: message.createdAt,
                      }),
                      true,
                  )
                : current,
        );
    });

    // (Un)muted here or in another tab of the viewer.
    useRealtimeEvent('chat:muted', ({ chatId, mute }) => {
        queryClient.setQueryData<ChatPages>(key, (current) =>
            current ? patchChat(current, chatId, (chat) => ({ ...chat, mute })) : current,
        );
    });

    // Read here or in another tab of the viewer.
    useRealtimeEvent('chat:read', ({ chatId, readerId }) => {
        if (readerId !== viewer.id) return;
        queryClient.setQueryData<ChatPages>(key, (current) =>
            current ? patchChat(current, chatId, (chat) => ({ ...chat, unread: 0 })) : current,
        );
    });

    return (
        <aside className={styles.sidebar}>
            <header className={styles.header}>
                <h1 className={styles.title}>Chats</h1>
                {totalUnread > 0 && (
                    <span className={styles.headerBadge} aria-label={`${totalUnread} unread`}>
                        {totalUnread}
                    </span>
                )}
            </header>

            <nav className={styles.list} aria-label="Chats">
                {query.isPending &&
                    Array.from({ length: SKELETON_ROWS }, (_, index) => (
                        <div key={index} className={styles.item}>
                            <Skeleton variant="rounded" className={styles.avatar} />
                            <span className={styles.meta}>
                                <Skeleton width="45%" />
                                <Skeleton width="70%" />
                            </span>
                        </div>
                    ))}

                {!query.isPending && chats.length === 0 && (
                    <p className={styles.empty}>No chats yet.</p>
                )}

                {chats.map((chat) => {
                    const active = chat.id === activeChatId;
                    const unread = chat.unread > 0 && !active;
                    const own = chat.lastMessage?.authorId === viewer.id;
                    const muted = isMuteActive(chat.mute, now);

                    return (
                        <div key={chat.id} className={styles.row}>
                            <Link
                                href={`/chats/${chat.id}`}
                                className={`${styles.item} ${active ? styles.itemActive : ''} ${unread ? styles.itemUnread : ''}`}
                                aria-current={active ? 'page' : undefined}
                                title={chat.user?.username}
                            >
                                <PeerAvatar user={chat.user} className={styles.avatar} />

                                <span className={styles.meta}>
                                    <span className={styles.line}>
                                        <span className={styles.username}>
                                            {chat.user?.username ?? 'Deleted account'}
                                        </span>
                                        {muted && (
                                            <NotificationsOffIcon
                                                className={styles.mutedIcon}
                                                aria-label="Muted"
                                            />
                                        )}
                                        {chat.lastMessage && (
                                            <time
                                                className={styles.time}
                                                dateTime={chat.lastMessage.createdAt}
                                            >
                                                {formatShortRelative(
                                                    chat.lastMessage.createdAt,
                                                    now,
                                                )}
                                            </time>
                                        )}
                                    </span>

                                    <span className={styles.line}>
                                        {typingChats[chat.id] ? (
                                            <TypingIndicator className={styles.typing} />
                                        ) : (
                                            <span className={styles.preview}>
                                                {chat.lastMessage &&
                                                    (own
                                                        ? `You: ${chat.lastMessage.content}`
                                                        : chat.lastMessage.content)}
                                            </span>
                                        )}
                                        {unread && (
                                            <span
                                                className={`${styles.badge} ${muted ? styles.badgeMuted : ''}`}
                                                aria-label={`${chat.unread} unread`}
                                            >
                                                {chat.unread > 99 ? '99+' : chat.unread}
                                            </span>
                                        )}
                                    </span>
                                </span>

                                {unread && (
                                    <span
                                        className={`${styles.compactDot} ${muted ? styles.badgeMuted : ''}`}
                                        aria-hidden
                                    />
                                )}
                            </Link>

                            <ChatMuteMenu
                                chatId={chat.id}
                                mute={muted ? chat.mute : null}
                                className={styles.menuButton}
                            />
                        </div>
                    );
                })}

                <div ref={loadMoreRef} className={styles.sentinel} />
                {query.isFetchingNextPage && (
                    <div className={styles.item}>
                        <Skeleton variant="rounded" className={styles.avatar} />
                    </div>
                )}
            </nav>
        </aside>
    );
}
