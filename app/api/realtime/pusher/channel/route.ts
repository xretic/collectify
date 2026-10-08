import { apiError, json, route } from '@/shared/server/http';
import { pusher, sessionKey } from '@/shared/server/realtime';
import { sessionChannelName } from '@/shared/lib/realtime/events';
import { requireChatViewer } from '@/features/auth/server/guards';

/** The private channel of the current session, which the client then subscribes to. */
export const GET = route(async (req) => {
    if (!pusher) throw apiError(503, 'realtimeUnavailable');

    const viewer = await requireChatViewer(req);

    return json({ channel: sessionChannelName(viewer.userId, sessionKey(viewer.session.id)) });
});
