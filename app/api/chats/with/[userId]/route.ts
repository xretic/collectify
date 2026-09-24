import { json, parseId, route } from '@/shared/server/http';
import { requireViewer } from '@/features/auth/server/guards';
import { findChatWith } from '@/features/chat/server/chats';

export const GET = route<{ userId: string }>(async (req, params) => {
    const viewer = await requireViewer(req);

    return json({ chatId: await findChatWith(viewer.userId, parseId(params.userId, 'user id')) });
});
