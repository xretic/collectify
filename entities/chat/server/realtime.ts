import 'server-only';
import Pusher from 'pusher';
import type { Server } from 'socket.io';
import { serverEnv } from '@/shared/server/env';
import {
    userChannelName,
    userRoomName,
    type RealtimeEventName,
    type RealtimeEvents,
} from '../model/types';

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

let warnedNoTransport = false;

/**
 * Best-effort fan-out to users' private channels. Never throws: the message is
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
            await pusher.trigger(recipients.map(userChannelName), event, payload);
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
