import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireChatViewer } from '@/features/auth/server/guards';
import { notifyTyping } from '@/features/chat/server/chats';

export const POST = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'realtime', viewer.userId);
    await notifyTyping(parseId(params.id), viewer.userId);

    return noContent();
});
