/**
 * Realtime event name → payload. Slices register their events with
 * declaration merging, e.g. in `entities/chat/model/types.ts`:
 *
 *     declare module '@/shared/lib/realtime/events' {
 *         interface RealtimeEvents { 'message:new': ChatMessage }
 *     }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RealtimeEvents {}

export type RealtimeEventName = keyof RealtimeEvents;

export const USER_CHANNEL_PREFIX = 'private-user-';

/**
 * Pusher private channel of one signed-in session. Events go only to channels
 * of sessions that still exist, so a revoked session stops receiving them.
 */
export const sessionChannelName = (userId: number, sessionKey: string) =>
    `${USER_CHANNEL_PREFIX}${userId}-${sessionKey}`;

/** Socket.IO room of one user (see server.mjs). */
export const userRoomName = (userId: number) => `user:${userId}`;
