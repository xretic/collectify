import { noContent, parseId, route } from '@/shared/server/http';
import { requireStaff } from '@/features/auth/server/guards';
import { deleteUserAccount } from '@/features/moderation/server/moderation';

export const DELETE = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req, { adminOnly: true });
    await deleteUserAccount(ctx, parseId(params.id));

    return noContent();
});
