import { api } from '@/shared/api/api';
import { ChatInResponse, MessageInResponse } from '@/types/ChatInResponse';

type Cursor = number | null;

export const chatApi = {
    list(skip: number) {
        return api
            .get('api/chats', {
                searchParams: { skip },
            })
            .json<{ data: ChatInResponse[]; total: number }>();
    },

    detail(chatId: string | number, cursor: Cursor) {
        return api
            .get(`api/chats/${chatId}`, {
                searchParams: cursor ? { cursor } : {},
            })
            .json<{ data: ChatInResponse; nextCursor: Cursor }>();
    },

    sendMessage(chatId: string | number, messageText: string) {
        return api
            .post(`api/chats/${chatId}`, { json: { messageText } })
            .json<{ data: MessageInResponse }>();
    },

    markAsRead(chatId: string | number) {
        return api.patch(`api/chats/${chatId}`);
    },

    getExistence(userId: string | number) {
        return api
            .get(`api/chats/${userId}/existence`)
            .json<{ chatId: number | undefined; result: boolean }>();
    },

    create(recipientUserId: string | number, message: string) {
        return api
            .post(`api/chats/${recipientUserId}/create`, {
                json: { message },
            })
            .json<{ id: number }>();
    },
};
