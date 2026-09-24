// Custom server: Next.js + Socket.IO on the same origin (`/socketio`).
// API routes publish through `globalThis.__collectifyIo` (same process), so
// there is no loopback HTTP endpoint that could be abused.
//
// On Vercel this file is not used — realtime goes through Pusher instead.

import { createServer } from 'node:http';
import next from 'next';
import pg from 'pg';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3000);

const SESSION_COOKIE = 'sessionId';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// `next()` loads `.env*` files, so DATABASE_URL is available after prepare().
await app.prepare();

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

function readCookie(header, name) {
    if (!header) return null;

    for (const part of header.split(';')) {
        const [key, ...value] = part.trim().split('=');
        if (key === name) return decodeURIComponent(value.join('='));
    }

    return null;
}

/**
 * Resolves the user of a valid, non-expired session whose account is not banned.
 * Prisma stores `TIMESTAMP(3)` in UTC, hence `NOW() AT TIME ZONE 'UTC'`.
 */
async function authenticate(sessionId) {
    const { rows } = await db.query(
        `SELECT s."userId"
         FROM "Session" s
         WHERE s.id = $1
           AND s."expiresAt" > (NOW() AT TIME ZONE 'UTC')
           AND NOT EXISTS (
               SELECT 1 FROM "AccountSanction" a
               WHERE a."userId" = s."userId"
                 AND a.scope = 'ACCOUNT'
                 AND a."revokedAt" IS NULL
                 AND (a."expiresAt" IS NULL OR a."expiresAt" > (NOW() AT TIME ZONE 'UTC'))
           )`,
        [sessionId],
    );

    return rows[0]?.userId ?? null;
}

/** Same-origin only: blocks cross-site WebSocket hijacking with the user's cookie. */
function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;

    try {
        const { host } = new URL(origin);
        return host === req.headers.host || origin === process.env.APP_URL;
    } catch {
        return false;
    }
}

const httpServer = createServer((req, res) => handle(req, res));

const io = new Server(httpServer, {
    path: '/socketio',
    allowRequest: (req, callback) => callback(null, isSameOrigin(req)),
});

globalThis.__collectifyIo = io;

io.use(async (socket, nextMiddleware) => {
    try {
        const sessionId = readCookie(socket.handshake.headers.cookie, SESSION_COOKIE);
        const userId = sessionId ? await authenticate(sessionId) : null;

        if (!userId) {
            nextMiddleware(new Error('Unauthorized.'));
            return;
        }

        socket.data.userId = userId;
        nextMiddleware();
    } catch (error) {
        console.error('[socket] auth failed:', error);
        nextMiddleware(new Error('Unauthorized.'));
    }
});

io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
});

httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
});
