import { json, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import { getCollectionStats } from '@/features/collection/server/stats';

export const GET = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'read', viewer.userId);

    return json(await getCollectionStats(parseId(params.id), viewer.userId));
});
