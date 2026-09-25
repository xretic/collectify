import { NextResponse } from 'next/server';
import { readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { resolveLocale } from '@/shared/i18n/request';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { registerUser } from '@/features/auth/server/accounts';
import { registerSchema } from '@/features/auth/model/schemas';

export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { locale, ...input } = await readBody(req, registerSchema);
    // Defaults to the language the visitor is browsing in.
    const userId = await registerUser({ ...input, locale: locale ?? (await resolveLocale()) });
    const session = await createSession(userId);
    const user = await getSessionUser(userId, null);

    const res = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(res, session);
    if (user) setLocaleCookie(res, user.locale);

    return res;
});
