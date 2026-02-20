import type { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

export const config = {
    api: { bodyParser: false },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const socket = res.socket;
    if (!socket) {
        res.status(500).end();
        return;
    }

    const server = socket.server;

    if (!server.io) {
        const io = new Server(server, {
            path: '/socketio',
            transports: ['websocket'],
            cors: {
                origin: [process.env.NEXT_PUBLIC_VERCEL_URL],
                credentials: true,
            },
        });

        console.log('NEXT_PUBLIC_SOCKET_URL', process.env.NEXT_PUBLIC_SOCKET_URL);

        server.io = io;
        global._io = io;

        io.on('connection', (s) => {
            s.on('chat:join', (chatId: number) => s.join(`chat:${chatId}`));
            s.on('chat:leave', (chatId: number) => s.leave(`chat:${chatId}`));
        });
    }

    res.end();
}
