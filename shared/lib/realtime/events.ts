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

/** Pusher private channel / Socket.IO room of one user (see server.mjs). */
export const userChannelName = (userId: number) => `private-user-${userId}`;
export const userRoomName = (userId: number) => `user:${userId}`;
