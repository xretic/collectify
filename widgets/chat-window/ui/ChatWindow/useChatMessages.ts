'use client';

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import type { ChatMessage, ChatMessagesPage, ChatSeenReceipt } from '@/entities/chat/model/types';

/**
 * Messages of one chat. Page 0 holds the newest messages; older pages are
 * appended as the user scrolls up. Each page is oldest-first.
 */
export function useChatMessages(chatId: number) {
    const queryClient = useQueryClient();
    const key = chatQueryKeys.messages(chatId);

    const query = useInfiniteQuery({
        queryKey: key,
        queryFn: ({ pageParam }) => chatApi.messages(chatId, pageParam),
        initialPageParam: null as number | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: Infinity,
    });

    const messages = useMemo(
        () => (query.data ? [...query.data.pages].reverse().flatMap((page) => page.messages) : []),
        [query.data],
    );

    const setPages = useCallback(
        (transform: (pages: ChatMessagesPage[]) => ChatMessagesPage[]) =>
            queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
                key,
                (data) => data && { ...data, pages: transform(data.pages) },
            ),
        [key, queryClient],
    );

    /** Appends a message (from the composer or realtime), ignoring duplicates. */
    const append = useCallback(
        (message: ChatMessage) =>
            setPages((pages) => {
                if (
                    pages.some((page) =>
                        page.messages.some((existing) => existing.id === message.id),
                    )
                ) {
                    return pages;
                }

                const [newest, ...older] = pages;
                return [{ ...newest, messages: [...newest.messages, message] }, ...older];
            }),
        [setPages],
    );

    const removeMessage = useCallback(
        (messageId: number) =>
            setPages((pages) =>
                pages.map((page) => ({
                    ...page,
                    messages: page.messages.filter((message) => message.id !== messageId),
                })),
            ),
        [setPages],
    );

    /** Live "Seen" receipt (the chat header lives on page 0). */
    const setSeen = useCallback(
        (seen: ChatSeenReceipt) =>
            setPages(([newest, ...older]) => [
                { ...newest, chat: { ...newest.chat, seen } },
                ...older,
            ]),
        [setPages],
    );

    return {
        chat: query.data?.pages[0]?.chat ?? null,
        messages,
        query,
        append,
        removeMessage,
        setSeen,
    };
}
