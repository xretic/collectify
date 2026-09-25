import { noContent, parseId, route } from '@/shared/server/http';
import { requireChatViewer } from '@/features/auth/server/guards';
import { markChatRead } from '@/features/chat/server/chats';

export const PATCH = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await markChatRead(parseId(params.id, 'chat id'), viewer.userId);

    return noContent();
});
