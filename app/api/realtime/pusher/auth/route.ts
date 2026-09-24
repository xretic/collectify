import { z } from 'zod';
import { ApiError, forbidden, json, parse, route } from '@/shared/server/http';
import { pusher } from '@/entities/chat/server/realtime';
import { userChannelName } from '@/entities/chat/model/types';
import { requireViewer } from '@/features/auth/server/guards';

const formSchema = z.object({
    socket_id: z.string().min(1),
    channel_name: z.string().min(1),
});

export const POST = route(async (req) => {
    if (!pusher) throw new ApiError(503, 'Realtime provider is not configured.');

    const viewer = await requireViewer(req);
    const form = parse(formSchema, Object.fromEntries(await req.formData()));

    if (form.channel_name !== userChannelName(viewer.userId)) throw forbidden();

    return json(pusher.authorizeChannel(form.socket_id, form.channel_name));
});
