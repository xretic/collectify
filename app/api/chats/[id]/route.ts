import { z } from 'zod';
import { json, parseId, readQuery, route } from '@/shared/server/http';
import { idSchema } from '@/shared/lib/validation/ids';
import { requireViewer } from '@/features/auth/server/guards';
import { getChatMessages } from '@/features/chat/server/chats';

const querySchema = z.object({ cursor: idSchema.optional() });

export const GET = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    const { cursor } = readQuery(req, querySchema);

    return json(
        await getChatMessages(parseId(params.id, 'chat id'), viewer.userId, cursor ?? null),
    );
});
