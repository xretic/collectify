import { apiError, noContent, route } from '@/shared/server/http';
import { pusher } from '@/shared/server/realtime';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireChatViewer } from '@/features/auth/server/guards';
import { announceOnlineIfConnected } from '@/features/chat/server/presence';

/**
 * Called by the client once its private Pusher channel is subscribed, so chat
 * partners see it online right away without relying on the Pusher webhook
 * (going offline is still reported by the webhook and presence polling).
 * Nothing is announced unless the user's channel is occupied, and a repeated
 * "online" is not fanned out again (see `announcePresence`).
 */
export const POST = route(async (req) => {
    if (!pusher) throw apiError(503, 'realtimeUnavailable');

    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'realtime', viewer.userId);
    await announceOnlineIfConnected(viewer.userId);

    return noContent();
});
