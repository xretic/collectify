import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireChatViewer } from '@/features/auth/server/guards';
import { markChatRead } from '@/features/chat/server/chats';

export const PATCH = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'read', viewer.userId);
    await markChatRead(parseId(params.id), viewer.userId);

    return noContent();
});
