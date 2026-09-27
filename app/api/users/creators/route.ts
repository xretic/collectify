import { z } from 'zod';
import { json, readQuery, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { requireViewer } from '@/features/auth/server/guards';
import { listTopCreators } from '@/entities/user/server/creators';

const querySchema = z.object({
    /** Comma-separated category ids (`?categories=1,6`); empty means every category. */
    categories: z.preprocess(
        (value) => (typeof value === 'string' && value ? [...new Set(value.split(','))] : []),
        z.array(idSchema).max(50),
    ),
});

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);

    const { categories } = readQuery(req, querySchema);

    return json({ creators: await listTopCreators(viewer.userId, categories) });
});
