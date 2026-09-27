import { json, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { listRelatedCollections } from '@/entities/collection/server/related';

export const GET = route<{ id: string }>(async (req, { id }) => {
    await enforceRateLimit(req, 'search');

    return json({ collections: await listRelatedCollections(parseId(id)) });
});
