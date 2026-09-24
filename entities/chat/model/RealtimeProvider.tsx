'use client';

import {
    createContext,
    useContext,
    useEffect,
    useEffectEvent,
    useState,
    type ReactNode,
} from 'react';
import { io } from 'socket.io-client';
import Pusher from 'pusher-js';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { userChannelName, type RealtimeEventName, type RealtimeEvents } from './types';

type Handler<E extends RealtimeEventName> = (payload: RealtimeEvents[E]) => void;

type RealtimeClient = {
    on<E extends RealtimeEventName>(event: E, handler: Handler<E>): () => void;
    disconnect(): void;
};

const EVENTS: RealtimeEventName[] = ['message:new', 'message:deleted'];

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

/** Small typed event hub so transports only need to forward raw events. */
function createHub() {
    const handlers = new Map<RealtimeEventName, Set<(payload: unknown) => void>>();

    return {
        emit(event: RealtimeEventName, payload: unknown) {
            handlers.get(event)?.forEach((handler) => handler(payload));
        },
        on<E extends RealtimeEventName>(event: E, handler: Handler<E>) {
            const set = handlers.get(event) ?? new Set();
            set.add(handler as (payload: unknown) => void);
            handlers.set(event, set);
            return () => set.delete(handler as (payload: unknown) => void);
        },
    };
}

function createPusherClient(userId: number): RealtimeClient {
    const hub = createHub();
    const pusher = new Pusher(pusherKey!, {
        cluster: pusherCluster!,
        channelAuthorization: { endpoint: '/api/realtime/pusher/auth', transport: 'ajax' },
    });
    const channelName = userChannelName(userId);
    const channel = pusher.subscribe(channelName);

    EVENTS.forEach((event) => channel.bind(event, (payload: unknown) => hub.emit(event, payload)));

    return {
        on: hub.on,
        disconnect() {
            channel.unbind_all();
            pusher.unsubscribe(channelName);
            pusher.disconnect();
        },
    };
}

function createSocketClient(): RealtimeClient {
    const hub = createHub();
    const socket = io({ path: '/socketio', withCredentials: true });

    EVENTS.forEach((event) => socket.on(event, (payload: unknown) => hub.emit(event, payload)));
    socket.on('connect_error', (error) =>
        console.warn('[realtime] connection failed:', error.message),
    );

    return {
        on: hub.on,
        disconnect: () => socket.disconnect(),
    };
}

const RealtimeContext = createContext<RealtimeClient | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
    const { user } = useSessionUser();
    const userId = user?.id;
    const [client, setClient] = useState<RealtimeClient | null>(null);

    useEffect(() => {
        if (!userId) return;

        const next = pusherKey && pusherCluster ? createPusherClient(userId) : createSocketClient();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- the client is an external resource created here
        setClient(next);

        return () => {
            next.disconnect();
            setClient(null);
        };
    }, [userId]);

    return <RealtimeContext.Provider value={client}>{children}</RealtimeContext.Provider>;
}

/** Subscribes to a realtime event for the lifetime of the component. */
export function useRealtimeEvent<E extends RealtimeEventName>(event: E, handler: Handler<E>) {
    const client = useContext(RealtimeContext);
    const onEvent = useEffectEvent(handler);

    useEffect(() => {
        if (!client) return;
        return client.on(event, (payload) => onEvent(payload));
    }, [client, event]);
}
