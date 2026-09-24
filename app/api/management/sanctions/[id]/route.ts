import { noContent, parseId, route } from '@/shared/server/http';
import { requireStaff } from '@/features/auth/server/guards';
import { revokeSanction } from '@/features/moderation/server/moderation';

export const DELETE = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req);
    await revokeSanction(ctx, parseId(params.id, 'sanction id'));

    return noContent();
});
