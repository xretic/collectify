import 'server-only';
import { createHash } from 'node:crypto';
import Pusher from 'pusher';
import type { Server } from 'socket.io';
import {
    sessionChannelName,
    userRoomName,
    type RealtimeEventName,
    type RealtimeEvents,
} from '@/shared/lib/realtime/events';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/shared/lib/constants';
import { db } from './db';
import { canSendEmailLinks } from './email';
import { serverEnv } from './env';

declare global {
    // Set by server.mjs when the app runs behind the custom Socket.IO server.
    var __collectifyIo: Server | undefined;
}

const { PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER } =
    serverEnv;

export const pusher =
    PUSHER_APP_ID && PUSHER_SECRET && NEXT_PUBLIC_PUSHER_KEY && NEXT_PUBLIC_PUSHER_CLUSTER
        ? new Pusher({
              appId: PUSHER_APP_ID,
              key: NEXT_PUBLIC_PUSHER_KEY,
              secret: PUSHER_SECRET,
              cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
              useTLS: true,
          })
        : null;

/** Public, non-reversible id of a session, used in its channel name. */
export const sessionKey = (sessionId: string) =>
    createHash('sha256').update(sessionId).digest('hex').slice(0, 32);

type LiveSession = { id: string; userId: number };

/** Live sessions per user are reused this long: every event (typing pings too) needs them. */
const LIVE_SESSIONS_TTL_MS = 5_000;
const LIVE_SESSIONS_CACHE_MAX = 10_000;
const liveSessionsCache = new Map<number, { at: number; sessions: LiveSession[] }>();

function queryLiveSessions(userIds: number[]): Promise<LiveSession[]> {
    return db.session.findMany({
        where: {
            userId: { in: userIds },
            impersonatorUserId: null,
            expiresAt: { gt: new Date() },
            ...(canSendEmailLinks()
                ? {
                      user: {
                          OR: [
                              { emailVerifiedAt: { not: null } },
                              { email: { endsWith: `@${PLACEHOLDER_EMAIL_DOMAIN}` } },
                          ],
                      },
                  }
                : {}),
        },
        select: { id: true, userId: true },
    });
}

/**
 * Sessions that may receive realtime events: not expired, not impersonated
 * (the channel carries direct messages, which staff must not see), and of an
 * account that may be used (address confirmed, while confirmation is required).
 * Cached briefly per process; `fresh` reads the database.
 */
export async function liveSessions(
    userIds: number[],
    { fresh = false }: { fresh?: boolean } = {},
): Promise<LiveSession[]> {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return [];

    const now = Date.now();
    const result: LiveSession[] = [];
    const missing: number[] = [];

    for (const id of ids) {
        const cached = fresh ? undefined : liveSessionsCache.get(id);
        if (cached && now - cached.at < LIVE_SESSIONS_TTL_MS) result.push(...cached.sessions);
        else missing.push(id);
    }
    if (missing.length === 0) return result;

    const rows = await queryLiveSessions(missing);
    if (liveSessionsCache.size > LIVE_SESSIONS_CACHE_MAX) liveSessionsCache.clear();
    for (const id of missing) {
        liveSessionsCache.set(id, { at: now, sessions: rows.filter((row) => row.userId === id) });
    }

    return [...result, ...rows];
}

/** Drops cached sessions of these users (a session was created or ended). */
export function forgetLiveSessions(userIds: number[]) {
    for (const id of userIds) liveSessionsCache.delete(id);
}

/** Pusher rejects a trigger addressed to more channels than this. */
const PUSHER_MAX_CHANNELS_PER_TRIGGER = 100;

let warnedNoTransport = false;

/**
 * Best-effort fan-out to users' private channels. Never throws: the data is
 * already persisted, so a realtime failure must not fail the request.
 */
export async function publishToUsers<E extends RealtimeEventName>(
    userIds: number[],
    event: E,
    payload: RealtimeEvents[E],
): Promise<void> {
    const recipients = [...new Set(userIds)];

    try {
        if (pusher) {
            const client = pusher;
            const channels = (await liveSessions(recipients)).map((session) =>
                sessionChannelName(session.userId, sessionKey(session.id)),
            );
            const batches: string[][] = [];
            for (let i = 0; i < channels.length; i += PUSHER_MAX_CHANNELS_PER_TRIGGER) {
                batches.push(channels.slice(i, i + PUSHER_MAX_CHANNELS_PER_TRIGGER));
            }

            // One failed batch must not keep the others from being delivered.
            const results = await Promise.allSettled(
                batches.map((batch) => client.trigger(batch, event, payload)),
            );
            for (const result of results) {
                if (result.status === 'rejected') {
                    console.error('[realtime] publish failed:', result.reason);
                }
            }
            return;
        }

        const io = globalThis.__collectifyIo;

        if (io) {
            io.to(recipients.map(userRoomName)).emit(event, payload);
            return;
        }

        if (!warnedNoTransport) {
            warnedNoTransport = true;
            console.warn(
                '[realtime] No transport: run `npm run dev` (server.mjs) or configure Pusher.',
            );
        }
    } catch (error) {
        console.error('[realtime] publish failed:', error);
    }
}

/**
 * Call after deleting sessions (sign-out everywhere, ban, account deletion):
 * open Socket.IO connections of sessions that no longer exist are closed.
 * Pusher needs nothing: events only go to channels of live sessions.
 */
export async function dropRevokedConnections(userIds: number[]): Promise<void> {
    forgetLiveSessions(userIds);

    const io = globalThis.__collectifyIo;
    if (!io || userIds.length === 0) return;

    try {
        const sockets = await io.in(userIds.map(userRoomName)).fetchSockets();
        if (sockets.length === 0) return;

        const live = new Set(
            (await liveSessions(userIds, { fresh: true })).map((session) => session.id),
        );
        for (const socket of sockets) {
            if (!live.has(socket.data.sessionId)) socket.disconnect(true);
        }
    } catch (error) {
        console.error('[realtime] revoking connections failed:', error);
    }
}
