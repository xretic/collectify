import 'server-only';
import Pusher from 'pusher';
import type { Server } from 'socket.io';
import {
    userChannelName,
    userRoomName,
    type RealtimeEventName,
    type RealtimeEvents,
} from '@/shared/lib/realtime/events';
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
            const channels = recipients.map(userChannelName);
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
