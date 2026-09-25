import { json, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { categorySchema } from '@/entities/category/model/schemas';
import { listManagedCategories } from '@/entities/category/server/queries';
import { requireStaff } from '@/features/auth/server/guards';
import { createCategory } from '@/features/category/server/categories';

export const GET = route(async (req) => {
    await requireStaff(req, { adminOnly: true });
    return json({ categories: await listManagedCategories() });
});

export const POST = route(async (req) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    await enforceRateLimit(req, 'mutation', ctx.userId);

    const category = await createCategory(ctx, await readBody(req, categorySchema));
    return json({ category }, 201);
});
