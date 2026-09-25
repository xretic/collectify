import { json, noContent, parseId, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { categorySchema } from '@/entities/category/model/schemas';
import { requireStaff } from '@/features/auth/server/guards';
import { deleteCategory, updateCategory } from '@/features/category/server/categories';

type Params = { id: string };

export const PATCH = route<Params>(async (req, params) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    await enforceRateLimit(req, 'mutation', ctx.userId);

    const category = await updateCategory(
        ctx,
        parseId(params.id),
        await readBody(req, categorySchema),
    );
    return json({ category });
});

export const DELETE = route<Params>(async (req, params) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    await enforceRateLimit(req, 'mutation', ctx.userId);

    await deleteCategory(ctx, parseId(params.id));
    return noContent();
});
