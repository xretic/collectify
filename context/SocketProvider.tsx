'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/context/UserProvider';

type SocketCtx = { socket: Socket | null };
const Ctx = createContext<SocketCtx>({ socket: null });

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const [socket, setSocket] = useState<Socket | null>(null);

    const url = useMemo(() => {
        const raw = process.env.NEXT_PUBLIC_SOCKET_URL ?? '';
        return raw.replace(/\/+$/, '');
    }, []);

    useEffect(() => {
        if (loading || !user) return;
        if (!url) return;

        const s = io(url, {
            path: '/socketio',
            transports: ['websocket'],
            upgrade: false,
            withCredentials: true,
        });

        setSocket(s);

        return () => {
            s.disconnect();
            setSocket(null);
        };
    }, [loading, user?.id, url]);

    return <Ctx.Provider value={{ socket }}>{children}</Ctx.Provider>;
}

export function useSocket() {
    return useContext(Ctx).socket;
}
