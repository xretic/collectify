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
// Same as PLACEHOLDER_EMAIL_DOMAIN in shared/lib/constants.ts.
const PLACEHOLDER_EMAIL_DOMAIN = 'users.noreply.collectify';

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

function isUrl(value) {
    try {
        new URL(value ?? '');
        return true;
    } catch {
        return false;
    }
}

/**
 * While email links can be sent, an account whose address is not confirmed
 * cannot be used. Must match `canSendEmailLinks` in shared/server/email.ts
 * (where an APP_URL that is not a URL counts as unset).
 */
const requireConfirmedEmail =
    Boolean(process.env.RESEND_API_KEY?.trim()) &&
    (dev || (isUrl(process.env.APP_URL?.trim()) && Boolean(process.env.EMAIL_FROM?.trim())));

/**
 * Resolves the user of a valid, non-expired session whose account is not banned
 * (and has a confirmed address, when that is required).
 * Impersonated sessions are refused: the user room carries direct messages.
 * Prisma stores `TIMESTAMP(3)` in UTC, hence `NOW() AT TIME ZONE 'UTC'`.
 */
async function authenticate(sessionId) {
    const { rows } = await db.query(
        `SELECT s."userId"
         FROM "Session" s
         JOIN "User" u ON u.id = s."userId"
         WHERE s.id = $1
           AND s."expiresAt" > (NOW() AT TIME ZONE 'UTC')
           AND s."impersonatorUserId" IS NULL
           AND (NOT $2 OR u."emailVerifiedAt" IS NOT NULL OR u.email LIKE $3)
           AND NOT EXISTS (
               SELECT 1 FROM "AccountSanction" a
               WHERE a."userId" = s."userId"
                 AND a.scope = 'ACCOUNT'
                 AND a."revokedAt" IS NULL
                 AND (a."expiresAt" IS NULL OR a."expiresAt" > (NOW() AT TIME ZONE 'UTC'))
           )`,
        [sessionId, requireConfirmedEmail, `%@${PLACEHOLDER_EMAIL_DOMAIN}`],
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

// Client IP for rate limits. A client could send its own X-Real-IP /
// X-Forwarded-For, so unless a reverse proxy in front of this server sets them
// (TRUST_PROXY=true), they are replaced with the address of the connection.
const trustProxy = process.env.TRUST_PROXY === 'true';

const httpServer = createServer((req, res) => {
    if (!trustProxy) {
        delete req.headers['x-forwarded-for'];
        req.headers['x-real-ip'] = req.socket.remoteAddress ?? '';
    }
    return handle(req, res);
});

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
        // Lets the app close this connection once the session is revoked
        // (`dropRevokedConnections` in shared/server/realtime.ts).
        socket.data.sessionId = sessionId;
        nextMiddleware();
    } catch (error) {
        console.error('[socket] auth failed:', error);
        nextMiddleware(new Error('Unauthorized.'));
    }
});

/** Offline is announced after a grace period so page reloads do not flicker. */
const OFFLINE_GRACE_MS = 5_000;
const offlineTimers = new Map();

const userRoom = (userId) => `user:${userId}`;
const isConnected = (userId) => (io.sockets.adapter.rooms.get(userRoom(userId))?.size ?? 0) > 0;

/** Tells everyone the user chats with that they came online / went offline. */
async function announcePresence(userId, online) {
    try {
        const { rows } = await db.query(
            `SELECT DISTINCT other."B" AS id
             FROM "_ChatToUser" own
             JOIN "_ChatToUser" other ON other."A" = own."A" AND other."B" <> own."B"
             WHERE own."B" = $1`,
            [userId],
        );

        if (rows.length > 0) {
            io.to(rows.map((row) => userRoom(row.id))).emit('presence:changed', { userId, online });
        }
    } catch (error) {
        console.error('[socket] presence failed:', error);
    }
}

io.on('connection', (socket) => {
    const { userId } = socket.data;
    const wasOnline = isConnected(userId) || offlineTimers.has(userId);

    clearTimeout(offlineTimers.get(userId));
    offlineTimers.delete(userId);
    socket.join(userRoom(userId));

    if (!wasOnline) void announcePresence(userId, true);

    socket.on('disconnect', () => {
        if (isConnected(userId)) return;

        offlineTimers.set(
            userId,
            setTimeout(() => {
                offlineTimers.delete(userId);
                if (!isConnected(userId)) void announcePresence(userId, false);
            }, OFFLINE_GRACE_MS),
        );
    });
});

httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
});
