import { json, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireChatViewer } from '@/features/auth/server/guards';
import { findChatWith } from '@/features/chat/server/chats';

export const GET = route<{ userId: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);

    return json(await findChatWith(viewer.userId, parseId(params.userId)));
});
