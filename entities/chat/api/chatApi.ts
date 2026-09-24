import { api } from '@/shared/api/api';
import type { ChatMessage, ChatMessagesPage, ChatsPage } from '../model/types';

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

    async markAsRead(chatId: number) {
        await api.patch(`chats/${chatId}/read`);
    },

    async findWith(userId: number) {
        return (await api.get(`chats/with/${userId}`).json<{ chatId: number | null }>()).chatId;
    },

    /** Opens (or reuses) the direct chat with `userId` and sends the first message. */
    start(userId: number, content: string) {
        return api
            .post('chats', { json: { userId, content } })
            .json<{ chatId: number; message: ChatMessage }>();
    },
};
