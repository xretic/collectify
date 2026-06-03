import type { Server } from 'socket.io';
import type { MessageInResponse } from '@/types/ChatInResponse';
import { pusher, userChannelName } from '@/server/realtime/pusher';
import ky from 'ky';

type ServerToClientEvents = {
    'message:new': (message: SocketChatMessage) => void;
};

type ClientToServerEvents = {
    'chat:join': (chatId: number) => void;
    'chat:leave': (chatId: number) => void;
};

type SocketChatMessage = MessageInResponse & {
    chatId: number;
};

type CollectifySocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

type PublishChatMessagePayload = {
    chatId: number;
    senderUserId: number;
    recipientUserId: number;
    message: MessageInResponse;
};

declare global {
    var __collectifyIo: CollectifySocketServer | undefined;
}

function toSocketMessage({ chatId, message }: PublishChatMessagePayload): SocketChatMessage {
    return {
        ...message,
        chatId,
    };
}

async function publishChatMessageOverLoopback(payload: PublishChatMessagePayload) {
    const port = process.env.PORT ?? '3000';

    try {
        await ky.post(`http://127.0.0.1:${port}/__collectify/socket/publish`, {
            json: payload,
        });
    } catch (error) {
        console.error('Failed to publish chat message to socket server.', error);
    }
}

async function publishChatMessageToPusher(payload: PublishChatMessagePayload) {
    if (!pusher) return false;

    const channels = [
        userChannelName(payload.senderUserId),
        userChannelName(payload.recipientUserId),
    ];
    await pusher.trigger(channels, 'message:new', toSocketMessage(payload));

    return true;
}

export async function publishChatMessage(payload: PublishChatMessagePayload) {
    const publishedToPusher = await publishChatMessageToPusher(payload);
    if (publishedToPusher) return;

    const io = globalThis.__collectifyIo;

    if (!io) {
        await publishChatMessageOverLoopback(payload);
        return;
    }

    io.to([`user:${payload.senderUserId}`, `user:${payload.recipientUserId}`]).emit(
        'message:new',
        toSocketMessage(payload),
    );
}
