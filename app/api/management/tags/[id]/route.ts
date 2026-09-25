import { noContent, parseId, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { requireStaff } from '@/features/auth/server/guards';
import { deleteTag } from '@/features/tag/server/tags';

export const DELETE = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req);
    await enforceRateLimit(req, 'mutation', ctx.userId);

    await deleteTag(ctx, parseId(params.id));
    return noContent();
});
