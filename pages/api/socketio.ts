import type { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // @ts-expect-error next internal
    const server = res.socket?.server;
    if (!server) {
        res.status(500).end();
        return;
    }

    if (!server.io) {
        const io = new Server(server, {
            path: '/api/socketio',
            addTrailingSlash: false,
        });

        server.io = io;
        global._io = io;

        io.on('connection', (socket) => {
            socket.on('chat:join', (chatId: number) => {
                socket.join(`chat:${chatId}`);
            });

            socket.on('chat:leave', (chatId: number) => {
                socket.leave(`chat:${chatId}`);
            });
        });
    }

    res.end();
}
