import { createServer } from 'node:http';
import next from 'next';
import ky from 'ky';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

function emitChatMessage({ chatId, senderUserId, recipientUserId, message }) {
    io.to([`user:${senderUserId}`, `user:${recipientUserId}`]).emit('message:new', {
        ...message,
        chatId,
    });
}

function isLoopbackRequest(req) {
    const address = req.socket.remoteAddress;
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });

        req.on('error', reject);
    });
}

const httpServer = createServer((req, res) => {
    if (req.url === '/__collectify/socket/publish' && req.method === 'POST') {
        if (!isLoopbackRequest(req)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Forbidden.' }));
            return;
        }

        void readJsonBody(req)
            .then((payload) => {
                emitChatMessage(payload);
                res.writeHead(204);
                res.end();
            })
            .catch(() => {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid payload.' }));
            });

        return;
    }

    handle(req, res);
});

const io = new Server(httpServer, {
    path: '/socketio',
    cors: {
        origin: true,
        credentials: true,
    },
});

globalThis.__collectifyIo = io;

io.use(async (socket, nextMiddleware) => {
    const cookie = socket.handshake.headers.cookie;

    if (!cookie) {
        nextMiddleware(new Error('Unauthorized.'));
        return;
    }

    try {
        const forwardedProto = socket.handshake.headers['x-forwarded-proto'];
        const protocol = Array.isArray(forwardedProto)
            ? forwardedProto[0]
            : forwardedProto || (dev ? 'http' : 'https');
        const host = socket.handshake.headers.host ?? `localhost:${port}`;

        const response = await ky.get(`${protocol}://${host}/api/auth/me`, {
            headers: { cookie },
            throwHttpErrors: false,
        });

        if (!response.ok) {
            nextMiddleware(new Error('Unauthorized.'));
            return;
        }

        const data = await response.json();
        const userId = Number(data?.user?.id);

        if (!Number.isInteger(userId)) {
            nextMiddleware(new Error('Unauthorized.'));
            return;
        }

        socket.data.userId = userId;
        nextMiddleware();
    } catch (error) {
        nextMiddleware(error instanceof Error ? error : new Error('Unauthorized.'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    socket.on('chat:join', () => undefined);
    socket.on('chat:leave', () => undefined);
});

httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
});
