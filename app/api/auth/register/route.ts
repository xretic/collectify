import { after, NextResponse } from 'next/server';
import { readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { resolveLocale } from '@/shared/i18n/request';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { registerUser } from '@/features/auth/server/accounts';
import { registerSchema } from '@/features/auth/model/schemas';
import {
    emailLinkOrigin,
    logEmailFailure,
    requestEmailConfirmation,
} from '@/features/auth/server/emailLinks';

export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    // `ageConfirmed` is enforced by the schema; the account records when the terms were accepted.
    const { email, username, password, locale } = await readBody(req, registerSchema);
    // Defaults to the language the visitor is browsing in.
    const userId = await registerUser({
        email,
        username,
        password,
        locale: locale ?? (await resolveLocale()),
    });
    const session = await createSession(userId);
    const user = await getSessionUser(userId, null);

    // Best effort: without email sending the account still works (a banner asks to confirm later).
    const origin = emailLinkOrigin(req);
    if (origin) {
        after(() =>
            requestEmailConfirmation(userId, origin).catch(logEmailFailure('confirmation')),
        );
    }

    const res = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(res, session);
    if (user) setLocaleCookie(res, user.locale);

    return res;
});
