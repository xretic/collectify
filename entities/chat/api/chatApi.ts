import { api } from '@/shared/api/api';
import type { MuteDuration } from '../model/schemas';
import type {
    ChatMessage,
    ChatMessagesPage,
    ChatMuteState,
    ChatsPage,
    ChatWith,
} from '../model/types';

export const chatApi = {
    list(skip: number) {
        return api.get('chats', { searchParams: { skip } }).json<ChatsPage>();
    },

    messages(chatId: number, cursor: number | null) {
        return api
            .get(`chats/${chatId}`, { searchParams: cursor ? { cursor } : {} })
            .json<ChatMessagesPage>();
    },

    async send(chatId: number, content: string) {
        return (
            await api
                .post(`chats/${chatId}/messages`, { json: { content } })
                .json<{ message: ChatMessage }>()
        ).message;
    },

    /** Online status of everyone the viewer chats with (userId → online). */
    presence() {
        return api.get('chats/presence').json<Record<number, boolean>>();
    },

    async mute(chatId: number, duration: MuteDuration) {
        return (
            await api
                .put(`chats/${chatId}/mute`, { json: { duration } })
                .json<{ mute: ChatMuteState }>()
        ).mute;
    },

    async unmute(chatId: number) {
        await api.delete(`chats/${chatId}/mute`);
    },

    async markAsRead(chatId: number) {
        await api.patch(`chats/${chatId}/read`);
    },

    async typing(chatId: number) {
        await api.post(`chats/${chatId}/typing`);
    },

    findWith(userId: number) {
        return api.get(`chats/with/${userId}`).json<ChatWith>();
    },

    /** Opens (or reuses) the direct chat with `userId` and sends the first message. */
    start(userId: number, content: string) {
        return api
            .post('chats', { json: { userId, content } })
            .json<{ chatId: number; message: ChatMessage }>();
    },
};
