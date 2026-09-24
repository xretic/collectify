'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@mui/material';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import { managementApi } from '@/entities/moderation/api/managementApi';
import { managementQueryKeys } from '@/entities/moderation/model/queryKeys';
import { formatDateTime } from '@/shared/lib/format/date';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './index.module.css';

/** Admin-only: last messages of the user's chats. */
export function ChatHistory({ userId }: { userId: number }) {
    const query = useInfiniteQuery({
        queryKey: managementQueryKeys.chats(userId),
        queryFn: ({ pageParam }) => managementApi.chats(userId, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextSkip,
    });

    const chats = query.data?.pages.flatMap((page) => page.data) ?? [];

    if (query.isPending) return <Spinner />;
    if (chats.length === 0) return <EmptyState title="No conversations" />;

    return (
        <div className={styles.list}>
            {chats.map((chat) => (
                <div key={chat.id} className={styles.chat}>
                    <div className={styles.chatHeader}>
                        <ChatBubbleOutlineOutlinedIcon fontSize="small" />
                        Chat #{chat.id} ·{' '}
                        {chat.users
                            .filter((user) => user.id !== userId)
                            .map((user) => `@${user.username}`)
                            .join(', ') || 'deleted account'}
                    </div>

                    {chat.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`${styles.message} ${message.authorId === userId ? styles.own : ''}`}
                        >
                            <span className={styles.meta}>
                                @{message.authorUsername} · {formatDateTime(message.createdAt)}
                                {!message.read && ' · unread'}
                            </span>
                            <p>{message.content}</p>
                        </div>
                    ))}
                </div>
            ))}

            {query.hasNextPage && (
                <Button
                    size="small"
                    onClick={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                >
                    Load more chats
                </Button>
            )}
        </div>
    );
}
