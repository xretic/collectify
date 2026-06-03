'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Pusher from 'pusher-js';
import { useUser } from '@/context/UserProvider';
import { MessageInResponse } from '@/types/ChatInResponse';

type SocketMessage = MessageInResponse & { chatId: number };

type SocketIoListenEvents = {
    'message:new': (message: SocketMessage) => void;
};

type SocketIoEmitEvents = {
    'chat:join': (chatId: number) => void;
    'chat:leave': (chatId: number) => void;
};

type RealtimeClient = {
    provider: 'socket.io' | 'pusher';
    on: (event: 'message:new', handler: (message: SocketMessage) => void) => void;
    off: (event: 'message:new', handler: (message: SocketMessage) => void) => void;
    emit: (event: 'chat:join' | 'chat:leave', chatId: number) => void;
    disconnect: () => void;
};

type SocketCtx = { socket: RealtimeClient | null };
const Ctx = createContext<SocketCtx>({ socket: null });

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

function createSocketIoClient(): RealtimeClient {
    const socket: Socket<SocketIoListenEvents, SocketIoEmitEvents> = io({
        path: '/socketio',
        withCredentials: true,
    });

    socket.on('connect_error', (error) => {
        console.warn('Socket connection failed.', error.message);
    });

    return {
        provider: 'socket.io',
        on: (event, handler) => socket.on(event, handler),
        off: (event, handler) => socket.off(event, handler),
        emit: (event, chatId) => socket.emit(event, chatId),
        disconnect: () => socket.disconnect(),
    };
}

function createPusherClient(userId: number): RealtimeClient {
    const pusher = new Pusher(pusherKey!, {
        cluster: pusherCluster!,
        channelAuthorization: {
            endpoint: '/api/realtime/pusher/auth',
            transport: 'ajax',
        },
    });
    const channelName = `private-user-${userId}`;
    const channel = pusher.subscribe(channelName);

    pusher.connection.bind('error', (error: unknown) => {
        console.warn('Pusher connection failed.', error);
    });

    return {
        provider: 'pusher',
        on: (event, handler) => channel.bind(event, handler),
        off: (event, handler) => channel.unbind(event, handler),
        emit: () => undefined,
        disconnect: () => {
            channel.unbind_all();
            pusher.unsubscribe(channelName);
            pusher.disconnect();
        },
    };
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const userId = user?.id;
    const [socket, setSocket] = useState<RealtimeClient | null>(null);

    useEffect(() => {
        if (loading || !userId) return;

        const realtimeClient =
            pusherKey && pusherCluster ? createPusherClient(userId) : createSocketIoClient();

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(realtimeClient);

        return () => {
            realtimeClient.disconnect();
            setSocket(null);
        };
    }, [loading, userId]);

    return <Ctx.Provider value={{ socket }}>{children}</Ctx.Provider>;
}

export function useSocket() {
    return useContext(Ctx).socket;
}
