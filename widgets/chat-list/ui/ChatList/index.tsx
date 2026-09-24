'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Skeleton } from '@mui/material';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import { useRealtimeEvent } from '@/entities/chat/model/RealtimeProvider';
import type { ChatsPage } from '@/entities/chat/model/types';
import { CHATS_PAGE_SIZE } from '@/shared/lib/constants';
import { Pagination } from '@/shared/ui/Pagination';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './index.module.css';

type ChatListProps = {
    activeChatId: number | null;
    viewerId: number;
};

export function ChatList({ activeChatId, viewerId }: ChatListProps) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const skip = page * CHATS_PAGE_SIZE;

    const { data, isPending } = useQuery({
        queryKey: chatQueryKeys.list(skip),
        queryFn: () => chatApi.list(skip),
        placeholderData: keepPreviousData,
    });

    // Move the chat to the top with the new preview; unknown chats trigger a refetch.
    useRealtimeEvent('message:new', (message) => {
        const key = chatQueryKeys.list(skip);
        const current = queryClient.getQueryData<ChatsPage>(key);
        const chat = current?.data.find((item) => item.id === message.chatId);

        if (!current || !chat || page !== 0) {
            queryClient.invalidateQueries({ queryKey: chatQueryKeys.lists() });
            return;
        }

        const unread =
            message.author.id !== viewerId && message.chatId !== activeChatId
                ? chat.unread + 1
                : chat.unread;

        queryClient.setQueryData<ChatsPage>(key, {
            ...current,
            data: [
                {
                    ...chat,
                    unread,
                    lastMessage: { content: message.content, createdAt: message.createdAt },
                    lastMessageAt: message.createdAt,
                },
                ...current.data.filter((item) => item.id !== chat.id),
            ],
        });
    });

    return (
        <aside className={styles.sidebar}>
            <header className={styles.header}>
                <h1 className={styles.title}>Chats</h1>
            </header>

            <nav className={styles.list} aria-label="Chats">
                {isPending &&
                    Array.from({ length: CHATS_PAGE_SIZE }, (_, index) => (
                        <div key={index} className={styles.item}>
                            <Skeleton variant="circular" width={42} height={42} />
                            <Skeleton width={180} />
                        </div>
                    ))}

                {data?.data.length === 0 && <EmptyState title="No chats yet" />}

                {data?.data.map((chat) => (
                    <Link
                        key={chat.id}
                        href={`/chats/${chat.id}`}
                        className={`${styles.item} ${chat.id === activeChatId ? styles.itemActive : ''}`}
                        aria-current={chat.id === activeChatId ? 'page' : undefined}
                    >
                        <Avatar
                            className={styles.avatar}
                            src={chat.user?.avatarUrl}
                            alt={chat.user?.username}
                        />

                        <span className={styles.meta}>
                            <span className={styles.username}>
                                {chat.user?.username ?? 'Deleted account'}
                            </span>
                            <span className={styles.preview}>
                                {chat.lastMessage?.content ?? ''}
                            </span>
                        </span>

                        {chat.unread > 0 && chat.id !== activeChatId && (
                            <span className={styles.badge}>{chat.unread}</span>
                        )}
                    </Link>
                ))}
            </nav>

            <Pagination
                page={page}
                hasMore={skip + CHATS_PAGE_SIZE < (data?.total ?? 0)}
                onChange={setPage}
            />
        </aside>
    );
}
