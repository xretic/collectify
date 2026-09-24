import { NextResponse } from 'next/server';
import { readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { verifyCredentials } from '@/features/auth/server/accounts';
import { loginSchema } from '@/features/auth/model/schemas';

export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { email, password } = await readBody(req, loginSchema);
    const userId = await verifyCredentials(email, password);
    const session = await createSession(userId);

    const res = NextResponse.json({ user: await getSessionUser(userId, null) });
    setSessionCookie(res, session);

    return res;
});
