import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { idSchema } from '@/shared/lib/validation/ids';
import { listManagedUsers } from '@/entities/moderation/server/queries';
import { requireStaff } from '@/features/auth/server/guards';

const querySchema = z.object({
    query: z.string().trim().max(100).default(''),
    page: z.coerce.number().int().min(0).max(10_000).default(0),
    userId: idSchema.optional(),
});

export const GET = route(async (req) => {
    const ctx = await requireStaff(req);

    return json(await listManagedUsers(ctx, readQuery(req, querySchema)));
});
