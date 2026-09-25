import { z } from 'zod';
import { json, parseId, readQuery, route } from '@/shared/server/http';
import { listUserComments } from '@/entities/moderation/server/queries';
import { assertCanModerate, requireStaff } from '@/features/auth/server/guards';

const querySchema = z.object({ skip: z.coerce.number().int().min(0).max(100_000).default(0) });

export const GET = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req);
    const userId = parseId(params.id);
    await assertCanModerate(ctx, userId);

    const { skip } = readQuery(req, querySchema);

    return json(await listUserComments(userId, skip));
});
