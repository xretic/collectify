import { json, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { listCategoryShowcase } from '@/entities/category/server/queries';

export const GET = route(async (req) => {
    await enforceRateLimit(req, 'search');
    return json({ categories: await listCategoryShowcase() });
});
