import { NextResponse } from 'next/server';
import { readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { resetPassword } from '@/features/auth/server/accounts';
import { resetPasswordSchema } from '@/features/auth/model/schemas';

/** Sets the new password and signs in on this device (all other sessions are ended). */
export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { token, password } = await readBody(req, resetPasswordSchema);
    const userId = await resetPassword(token, password);
    const session = await createSession(userId);
    const user = await getSessionUser(userId, null);

    const res = NextResponse.json({ user });
    setSessionCookie(res, session);
    if (user) setLocaleCookie(res, user.locale);

    return res;
});
