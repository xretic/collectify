import { json, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { listActiveCategories } from '@/entities/category/server/queries';

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'read');

    return json({ categories: await listActiveCategories() });
});
