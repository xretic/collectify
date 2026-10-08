import { forbidden, json, readBody, route, unauthorized } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { getSessionUser } from '@/entities/user/server/profile';
import { requireViewer } from '@/features/auth/server/guards';
import { changePassword } from '@/features/auth/server/accounts';
import { changePasswordSchema } from '@/features/auth/model/schemas';

export const PATCH = route(async (req) => {
    const viewer = await requireViewer(req);
    // Staff signed in as a user must not give the account a password they know.
    if (viewer.session.impersonatorUserId) throw forbidden();
    await enforceRateLimit(req, 'auth', viewer.userId);

    await changePassword(
        viewer.userId,
        viewer.session.id,
        await readBody(req, changePasswordSchema),
    );

    const user = await getSessionUser(viewer.userId, viewer.session.impersonatorUserId);
    if (!user) throw unauthorized();

    return json({ user });
});
