import { z } from 'zod';
import { json, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { messageContentSchema } from '@/entities/chat/model/schemas';
import { requireChatViewer } from '@/features/auth/server/guards';
import { sendMessage } from '@/features/chat/server/chats';

const bodySchema = z.object({ content: messageContentSchema });

export const POST = route<{ id: string }>(async (req, params) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'message', viewer.userId);

    const { content } = await readBody(req, bodySchema);
    const message = await sendMessage(parseId(params.id, 'chat id'), viewer.userId, content);

    return json({ message }, 201);
});
