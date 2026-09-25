import { z } from 'zod';
import { json, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { idSchema } from '@/shared/lib/validation/ids';
import { requireViewer } from '@/features/auth/server/guards';
import { getInterests, setInterests } from '@/features/interest/server/interests';

const bodySchema = z.object({ categoryIds: z.array(idSchema).max(50) });

export const GET = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'search', viewer.userId);
    return json({ categoryIds: await getInterests(viewer.userId) });
});

export const PUT = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'mutation', viewer.userId);

    const { categoryIds } = await readBody(req, bodySchema);
    await setInterests(viewer.userId, categoryIds);

    return json({ categoryIds: await getInterests(viewer.userId) });
});
