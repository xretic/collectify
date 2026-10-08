import { z } from 'zod';
import { json, parseId, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { requireChatViewer } from '@/features/auth/server/guards';
import { getChatMessages } from '@/features/chat/server/chats';

const querySchema = z.object({ cursor: idSchema.optional() });

export const GET = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'read', viewer.userId);
    const { cursor } = readQuery(req, querySchema);

    return json(await getChatMessages(parseId(params.id), viewer.userId, cursor ?? null));
});
