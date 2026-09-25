import { noContent, parseId, readBody, route } from '@/shared/server/http';
import { requireStaff } from '@/features/auth/server/guards';
import { setUserRole } from '@/features/moderation/server/moderation';
import { setRoleSchema } from '@/features/moderation/model/schemas';

export const PATCH = route<{ id: string }>(async (req, params) => {
    const ctx = await requireStaff(req);
    await setUserRole(ctx, parseId(params.id), await readBody(req, setRoleSchema));

    return noContent();
});
