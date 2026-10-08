import 'server-only';
import {
    sessionChannelName,
    USER_CHANNEL_PREFIX,
    userRoomName,
} from '@/shared/lib/realtime/events';
import { liveSessions, pusher, sessionKey } from './realtime';

/** Up to this many users are looked up one by one; more use the shared listing. */
const SINGLE_LOOKUP_MAX = 5;
/** How long one listing of every occupied user channel is reused by this process. */
const LISTING_TTL_MS = 5_000;

type PusherClient = NonNullable<typeof pusher>;

let listing: { at: number; channels: Promise<Set<string>> } | null = null;

async function listChannels(client: PusherClient, prefix: string): Promise<Set<string>> {
    const response = await client.get({ path: '/channels', params: { filter_by_prefix: prefix } });
    const body = (await response.json()) as { channels: Record<string, unknown> };
    return new Set(Object.keys(body.channels));
}

/**
 * Every occupied user channel. The listing grows with the number of people
 * online, so concurrent and repeated lookups share one request per
 * `LISTING_TTL_MS` instead of each asking Pusher again.
 */
function occupiedUserChannels(client: PusherClient): Promise<Set<string>> {
    if (listing && Date.now() - listing.at < LISTING_TTL_MS) return listing.channels;

    const channels = listChannels(client, USER_CHANNEL_PREFIX);
    const entry = { at: Date.now(), channels };
    listing = entry;
    // A failed listing must not be served from the cache.
    channels.catch(() => {
        if (listing === entry) listing = null;
    });

    return channels;
}

/**
 * Users (of `userIds`) with an open realtime connection right now: an occupied
 * Pusher channel of one of their live sessions (a revoked session's channel
 * does not count), or a non-empty Socket.IO room. Best-effort: nobody is
 * online when the transport is missing or fails.
 */
export async function getOnlineUserIds(userIds: number[]): Promise<Set<number>> {
    const online = new Set<number>();
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return online;

    try {
        if (pusher) {
            const client = pusher;
            const [sessions, occupied] = await Promise.all([
                liveSessions(ids),
                ids.length <= SINGLE_LOOKUP_MAX
                    ? Promise.all(
                          ids.map((id) => listChannels(client, `${USER_CHANNEL_PREFIX}${id}-`)),
                      ).then((sets) => new Set(sets.flatMap((set) => [...set])))
                    : occupiedUserChannels(client),
            ]);

            for (const session of sessions) {
                if (occupied.has(sessionChannelName(session.userId, sessionKey(session.id)))) {
                    online.add(session.userId);
                }
            }

            return online;
        }

        const rooms = globalThis.__collectifyIo?.sockets.adapter.rooms;

        for (const id of ids) {
            if (rooms?.get(userRoomName(id))?.size) online.add(id);
        }
    } catch (error) {
        console.error('[presence] lookup failed:', error);
    }

    return online;
}

const CHANNEL_PATTERN = new RegExp(`^${USER_CHANNEL_PREFIX}(\\d+)-[0-9a-f]+$`);

/** User id of a session channel (`private-user-42-<key>` → 42), otherwise `null`. */
export function parseUserChannelName(channel: string): number | null {
    const match = CHANNEL_PATTERN.exec(channel);
    if (!match) return null;

    const id = Number(match[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}
