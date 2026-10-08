import { json, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { listRelatedCollections } from '@/entities/collection/server/related';
import { getViewer } from '@/features/auth/server/guards';

export const GET = route<{ id: string }>(async (req, { id }) => {
    const viewer = await getViewer(req);
    await enforceRateLimit(req, 'search', viewer?.userId);

    return json({
        collections: await listRelatedCollections(parseId(id), viewer?.userId ?? null),
    });
});
