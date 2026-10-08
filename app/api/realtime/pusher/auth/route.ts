import { z } from 'zod';
import { apiError, forbidden, json, parse, route } from '@/shared/server/http';
import { pusher, sessionKey } from '@/shared/server/realtime';
import { sessionChannelName } from '@/shared/lib/realtime/events';
import { requireViewer } from '@/features/auth/server/guards';

const formSchema = z.object({
    socket_id: z.string().min(1),
    channel_name: z.string().min(1),
});

export const POST = route(async (req) => {
    if (!pusher) throw apiError(503, 'realtimeUnavailable');

    const viewer = await requireViewer(req);
    // The user channel carries direct messages, which staff must not see.
    if (viewer.session.impersonatorUserId) throw forbidden();
    const form = parse(formSchema, Object.fromEntries(await req.formData()));

    // Only the channel of this very session (see `sessionChannelName`).
    if (form.channel_name !== sessionChannelName(viewer.userId, sessionKey(viewer.session.id))) {
        throw forbidden();
    }

    return json(pusher.authorizeChannel(form.socket_id, form.channel_name));
});
