import { noContent, parseId, route } from '@/shared/server/http';
import { requireStaff } from '@/features/auth/server/guards';
import { startImpersonation } from '@/features/moderation/server/moderation';

export const POST = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    await startImpersonation(ctx, parseId(params.id, 'user id'));

    return noContent();
});
