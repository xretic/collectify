import { json, parseId, route } from '@/shared/server/http';
import { requireViewer } from '@/features/auth/server/guards';
import { getCollectionStats } from '@/features/collection/server/stats';

export const GET = route<{ id: string }>(async (req, params) => {
    const viewer = await requireViewer(req);

    return json(await getCollectionStats(parseId(params.id), viewer.userId));
});
