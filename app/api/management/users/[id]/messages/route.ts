import { z } from 'zod';
import { json, parseId, readQuery, route } from '@/shared/server/http';
import { listUserChats } from '@/entities/moderation/server/queries';
import { assertCanModerate, requireStaff } from '@/features/auth/server/guards';

const querySchema = z.object({ skip: z.coerce.number().int().min(0).max(100_000).default(0) });

export const GET = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    const userId = parseId(params.id, 'user id');
    await assertCanModerate(ctx, userId);

    const { skip } = readQuery(req, querySchema);

    return json(await listUserChats(userId, skip));
});
