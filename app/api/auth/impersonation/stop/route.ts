import { json, route, unauthorized } from '@/shared/server/http';
import { findActiveSession, readSessionId } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { stopImpersonation } from '@/features/auth/server/accounts';

// Uses the raw session on purpose: an admin impersonating a user who got
// banned meanwhile must still be able to get back.
export const POST = route(async (req) => {
    const session = await findActiveSession(readSessionId(req));
    if (!session) throw unauthorized();

    const adminId = await stopImpersonation(session);

    return json({ user: await getSessionUser(adminId, null) });
});
