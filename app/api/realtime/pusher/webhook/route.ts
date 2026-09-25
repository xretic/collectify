import { apiError, noContent, route, unauthorized } from '@/shared/server/http';
import { pusher } from '@/shared/server/realtime';
import { getOnlineUserIds, parseUserChannelName } from '@/shared/server/presence';
import { announcePresence } from '@/features/chat/server/presence';

/**
 * Pusher "Channel existence" webhook: a user's private channel is occupied
 * while they have the app open, so occupied/vacated is their online status.
 * Configure it in the Pusher dashboard → Webhooks → `<APP_URL>/api/realtime/pusher/webhook`.
 */
export const POST = route(async (req) => {
    if (!pusher) throw apiError(503, 'realtimeUnavailable');

    const webhook = pusher.webhook({
        headers: Object.fromEntries(req.headers),
        rawBody: await req.text(),
    });
    if (!webhook.isValid()) throw unauthorized('invalidWebhookSignature');

    for (const event of webhook.getEvents()) {
        const userId = parseUserChannelName(event.channel);
        if (!userId) continue;

        if (event.name === 'channel_occupied') await announcePresence(userId, true);
        // A reload closes the old connection after the new one announced itself
        // online: only report offline if the channel is still empty.
        if (event.name === 'channel_vacated' && !(await getOnlineUserIds([userId])).has(userId)) {
            await announcePresence(userId, false);
        }
    }

    return noContent();
});
