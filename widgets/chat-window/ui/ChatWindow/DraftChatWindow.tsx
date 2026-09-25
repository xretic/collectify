'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/entities/chat/api/chatApi';
import { chatQueryKeys } from '@/entities/chat/model/queryKeys';
import { useIsOnline, useSyncPresence } from '@/entities/chat/model/presenceStore';
import type { SessionUser } from '@/entities/user/model/types';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { MessageComposer } from '@/features/chat/send/ui/MessageComposer';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import { ChatHeader, ChatIntro } from './ChatHeader';
import styles from './index.module.css';

type DraftChatWindowProps = {
    userId: number;
    viewer: SessionUser;
};

/**
 * An empty conversation with `userId` that exists only on the viewer's screen: the chat is
 * created by the first message, and leaving without sending one leaves nothing behind.
 */
export function DraftChatWindow({ userId, viewer }: DraftChatWindowProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: chatQueryKeys.with(userId),
        queryFn: () => chatApi.findWith(userId),
        staleTime: 0,
    });

    const chatId = query.data?.chatId ?? null;
    const peer = query.data?.user ?? null;
    const peers = useMemo(() => (peer ? [peer] : undefined), [peer]);
    useSyncPresence(peers, query.dataUpdatedAt);
    const online = useIsOnline(peer);

    // A chat already exists: open it instead.
    useEffect(() => {
        if (chatId) router.replace(`/chats/${chatId}`);
    }, [chatId, router]);

    // They wrote first while the draft was open.
    useRealtimeEvent('message:new', (message) => {
        if (message.author.id === userId) router.replace(`/chats/${message.chatId}`);
    });

    const startChat = async (content: string) => {
        const started = await chatApi.start(userId, content);

        queryClient.removeQueries({ queryKey: chatQueryKeys.with(userId) });
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.lists() });
        router.replace(`/chats/${started.chatId}`);

        return started.message;
    };

    return (
        <section className={styles.window} aria-label="Conversation">
            <ChatHeader peer={peer} deleted={false} online={online} />

            <div className={styles.messages}>
                {query.isError ? (
                    <EmptyState title="This chat is not available." />
                ) : (
                    <div className={styles.thread}>
                        {query.isPending || chatId ? (
                            <Spinner />
                        ) : (
                            peer && <ChatIntro peer={peer} />
                        )}
                    </div>
                )}
            </div>

            <MessageComposer
                sendMessage={startChat}
                restriction={viewer.restrictions.messenger}
                disabled={!peer || Boolean(chatId)}
            />
        </section>
    );
}
