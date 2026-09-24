import type { UserPreview } from '@/entities/user/model/types';

export type ChatMessage = {
    id: number;
    chatId: number;
    content: string;
    createdAt: string;
    author: UserPreview;
};

export type ChatPreview = {
    id: number;
    /** The other participant; `null` when their account was deleted. */
    user: UserPreview | null;
    lastMessage: { content: string; createdAt: string } | null;
    lastMessageAt: string;
    unread: number;
};

export type ChatsPage = {
    data: ChatPreview[];
    total: number;
};

export type ChatMessagesPage = {
    chat: { id: number; user: UserPreview | null };
    /** Oldest first. */
    messages: ChatMessage[];
    nextCursor: number | null;
};

export type RealtimeEvents = {
    'message:new': ChatMessage;
    'message:deleted': { chatId: number; messageId: number };
};

export type RealtimeEventName = keyof RealtimeEvents;

export const userChannelName = (userId: number) => `private-user-${userId}`;
export const userRoomName = (userId: number) => `user:${userId}`;
