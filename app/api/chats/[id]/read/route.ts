import { noContent, parseId, route } from '@/shared/server/http';
import { requireViewer } from '@/features/auth/server/guards';
import { markChatRead } from '@/features/chat/server/chats';

export const PATCH = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await markChatRead(parseId(params.id, 'chat id'), viewer.userId);

    return noContent();
});
