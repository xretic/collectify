import { z } from 'zod';
import { json, noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { muteDurationSchema } from '@/entities/chat/model/schemas';
import { requireChatViewer } from '@/features/auth/server/guards';
import { muteChat, unmuteChat } from '@/features/chat/server/mute';

const muteSchema = z.object({ duration: muteDurationSchema });

export const PUT = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);
    const { duration } = await readBody(req, muteSchema);

    return json({ mute: await muteChat(parseId(params.id, 'chat id'), viewer.userId, duration) });
});

export const DELETE = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);
    await unmuteChat(parseId(params.id, 'chat id'), viewer.userId);

    return noContent();
});
