import type { UserPreview } from '@/entities/user/model/types';

export type ChatMessage = {
    id: number;
    chatId: number;
    content: string;
    createdAt: string;
    author: UserPreview;
};

/** The other participant of a direct chat. */
export type ChatPeer = UserPreview & {
    /** Has an open realtime connection (see `presence:changed` for updates). */
    online: boolean;
};

/** Latest message of the viewer that the other participant has seen. */
export type ChatSeenReceipt = {
    messageId: number;
    readAt: string;
};

/** The viewer's chat with a user (`null` until the first message) and that user. */
export type ChatWith = {
    chatId: number | null;
    user: ChatPeer;
};

export type ChatPreview = {
    id: number;
    /** The other participant; `null` when their account was deleted. */
    user: ChatPeer | null;
    lastMessage: { content: string; createdAt: string; authorId: number } | null;
    lastMessageAt: string;
    unread: number;
    /** The viewer silenced this chat's notifications. */
    mute: ChatMuteState | null;
};

/** `until: null` is muted until turned back on. */
export type ChatMuteState = { until: string | null };

export type ChatsPage = {
    data: ChatPreview[];
    total: number;
};

export type ChatMessagesPage = {
    chat: { id: number; user: ChatPeer | null; seen: ChatSeenReceipt | null };
    /** Oldest first. */
    messages: ChatMessage[];
    nextCursor: number | null;
};

declare module '@/shared/lib/realtime/events' {
    interface RealtimeEvents {
        'message:new': ChatMessage;
        /** New message for the recipient that should notify (the chat is not muted). */
        'message:notify': ChatMessage;
        /** The viewer (un)muted a chat, possibly in another tab. */
        'chat:muted': { chatId: number; mute: ChatMuteState | null };
        'message:deleted': { chatId: number; messageId: number };
        /** `readerId` has seen every message of the chat up to `messageId`. */
        'chat:read': ChatSeenReceipt & { chatId: number; readerId: number };
        /** A chat partner connected (first tab) or disconnected (last tab). */
        'presence:changed': { userId: number; online: boolean };
        /** `userId` is typing in the chat; repeats while they keep typing. */
        'chat:typing': { chatId: number; userId: number };
    }
}
