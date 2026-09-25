import 'server-only';
import { userChannelName, userRoomName } from '@/shared/lib/realtime/events';
import { pusher } from './realtime';

const USER_CHANNEL_PREFIX = userChannelName(0).slice(0, -1);

/** Up to this many users are looked up channel by channel; more use the shared listing. */
const SINGLE_LOOKUP_MAX = 5;
/** How long one listing of every occupied user channel is reused by this process. */
const LISTING_TTL_MS = 5_000;

type PusherClient = NonNullable<typeof pusher>;

let listing: { at: number; channels: Promise<Set<string>> } | null = null;

/**
 * Every occupied user channel. The listing grows with the number of people
 * online, so concurrent and repeated lookups share one request per
 * `LISTING_TTL_MS` instead of each asking Pusher again.
 */
function occupiedUserChannels(client: PusherClient): Promise<Set<string>> {
    if (listing && Date.now() - listing.at < LISTING_TTL_MS) return listing.channels;

    const channels = client
        .get({ path: '/channels', params: { filter_by_prefix: USER_CHANNEL_PREFIX } })
        .then((response) => response.json() as Promise<{ channels: Record<string, unknown> }>)
        .then((body) => new Set(Object.keys(body.channels)));

    const entry = { at: Date.now(), channels };
    listing = entry;
    // A failed listing must not be served from the cache.
    channels.catch(() => {
        if (listing === entry) listing = null;
    });

    return channels;
}

async function isChannelOccupied(client: PusherClient, channel: string) {
    const response = await client.get({ path: `/channels/${channel}` });
    return ((await response.json()) as { occupied?: boolean }).occupied === true;
}

/**
 * Users (of `userIds`) with an open realtime connection right now: an occupied
 * private Pusher channel, or a non-empty Socket.IO room. Best-effort: nobody
 * is online when the transport is missing or fails.
 */
export async function getOnlineUserIds(userIds: number[]): Promise<Set<number>> {
    const online = new Set<number>();
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return online;

    try {
        if (pusher) {
            if (ids.length <= SINGLE_LOOKUP_MAX) {
                const client = pusher;
                const occupied = await Promise.all(
                    ids.map((id) => isChannelOccupied(client, userChannelName(id))),
                );
                ids.forEach((id, index) => occupied[index] && online.add(id));
                return online;
            }

            const channels = await occupiedUserChannels(pusher);
            for (const id of ids) {
                if (channels.has(userChannelName(id))) online.add(id);
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

/** User id of a private user channel (`private-user-42` → 42), otherwise `null`. */
export function parseUserChannelName(channel: string): number | null {
    if (!channel.startsWith(USER_CHANNEL_PREFIX)) return null;

    const id = Number(channel.slice(USER_CHANNEL_PREFIX.length));
    return Number.isInteger(id) && id > 0 ? id : null;
}
