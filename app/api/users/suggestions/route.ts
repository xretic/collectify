import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { SUGGESTIONS_POOL_SIZE, suggestPeople } from '@/entities/user/server/suggestions';
import { requireViewer } from '@/features/auth/server/guards';

const querySchema = z.object({
    skip: z.coerce.number().int().min(0).max(SUGGESTIONS_POOL_SIZE).default(0),
    take: z.coerce.number().int().min(1).max(50).default(6),
});

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);

    return json(await suggestPeople(viewer.userId, readQuery(req, querySchema)));
});
