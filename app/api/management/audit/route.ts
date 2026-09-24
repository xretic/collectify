import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { idSchema } from '@/shared/lib/validation/ids';
import { listAudit } from '@/entities/moderation/server/queries';
import { assertCanModerate, requireStaff } from '@/features/auth/server/guards';

const querySchema = z.object({ userId: idSchema, cursor: idSchema.optional() });

export const GET = route(async (req) => {
    const ctx = await requireStaff(req);
    const { userId, cursor } = readQuery(req, querySchema);

    await assertCanModerate(ctx, userId);

    return json(await listAudit(userId, cursor ?? null));
});
