import { z } from 'zod';
import { json, readBody, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { messageContentSchema } from '@/entities/chat/model/schemas';
import { requireChatViewer } from '@/features/auth/server/guards';
import { listChats, startChat } from '@/features/chat/server/chats';

const listSchema = z.object({ skip: z.coerce.number().int().min(0).max(100_000).default(0) });
const startSchema = z.object({ userId: idSchema, content: messageContentSchema });

export const GET = route(async (req) => {
    const viewer = await requireChatViewer(req);
    const { skip } = readQuery(req, listSchema);

    return json(await listChats(viewer.userId, skip));
});

export const POST = route(async (req) => {
    const viewer = await requireChatViewer(req);
    await enforceRateLimit(req, 'message', viewer.userId);

    const { userId, content } = await readBody(req, startSchema);

    return json(await startChat(viewer.userId, userId, content), 201);
});
