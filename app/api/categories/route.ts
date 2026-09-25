import { json, route } from '@/shared/server/http';
import { listActiveCategories } from '@/entities/category/server/queries';

export const GET = route(async () => {
    return json({ categories: await listActiveCategories() });
});
