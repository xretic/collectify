'use client';

import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/context/UserProvider';

type SocketCtx = { socket: Socket | null };

const Ctx = createContext<SocketCtx>({ socket: null });

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (loading || !user) return;

        fetch('/api/socketio');

        const socket = io({ path: '/api/socketio' });
        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [loading, user?.id]);

    const value = useMemo(() => ({ socket: socketRef.current }), [socketRef.current]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSocket() {
    return useContext(Ctx).socket;
}
