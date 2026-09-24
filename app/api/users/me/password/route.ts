import { json, readBody, route, unauthorized } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { getSessionUser } from '@/entities/user/server/profile';
import { requireViewer } from '@/features/auth/server/guards';
import { changePassword } from '@/features/auth/server/accounts';
import { changePasswordSchema } from '@/features/auth/model/schemas';

export const PATCH = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'auth', viewer.userId);

    await changePassword(viewer.userId, await readBody(req, changePasswordSchema));

    const user = await getSessionUser(viewer.userId, viewer.session.impersonatorUserId);
    if (!user) throw unauthorized();

    return json({ user });
});
