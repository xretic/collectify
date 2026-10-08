import { after, NextResponse, type NextRequest } from 'next/server';
import { errorResponse, forbidden, readBody, route } from '@/shared/server/http';
import {
    enforceRateLimit,
    enforceRateLimitFor,
    getClientIp,
    tryRateLimitFor,
} from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { verifyCredentials } from '@/features/auth/server/accounts';
import {
    emailLinkOrigin,
    logEmailFailure,
    needsEmailConfirmation,
    newestConfirmationLink,
    newLinkToken,
    requestEmailConfirmation,
    setConfirmCookie,
} from '@/features/auth/server/emailLinks';
import { loginSchema } from '@/features/auth/model/schemas';

/** A link sent this recently is still on its way: no new one (it would cancel it). */
const RESEND_AFTER_MS = 10 * 60 * 1000;

/**
 * Failed sign-ins are limited per account and IP (guessing from one place) and,
 * much higher, per account (guessing spread over many IPs). Only failures count:
 * a success gives both attempts back. A stranger can therefore not lock the
 * owner out from a single IP.
 */
async function limitSignIn(req: NextRequest, email: string) {
    const releaseFromIp = await enforceRateLimitFor(`login:${email}:${getClientIp(req)}`, 'login');
    const releaseAccount = await enforceRateLimitFor(`login:${email}`, 'loginAccount');

    return () => Promise.all([releaseFromIp(), releaseAccount()]);
}

/**
 * The password was right but the address is not confirmed: answer 403 and bind
 * the confirmation link to this browser (opening it here signs in). A link
 * sent in the last few minutes is kept rather than replaced; otherwise a new
 * one goes out within the address's email limit. Past the limit the newest
 * working link is bound instead and the answer says no new mail was sent
 * (`emailNotVerifiedWait`).
 */
async function unconfirmedResponse(userId: number, email: string, origin: string) {
    const newest = await newestConfirmationLink(userId);
    const sentRecently = newest && Date.now() - newest.createdAt.getTime() < RESEND_AFTER_MS;

    let linkId = newest?.id ?? null;
    let code: 'emailNotVerified' | 'emailNotVerifiedWait' = 'emailNotVerified';

    if (!sentRecently) {
        const release = await tryRateLimitFor(`email:${email}`, 'email');

        if (release) {
            const link = newLinkToken();
            linkId = link.id;
            after(() =>
                requestEmailConfirmation(userId, origin, link).catch(async (error) => {
                    logEmailFailure('confirmation')(error);
                    await release();
                }),
            );
        } else {
            code = 'emailNotVerifiedWait';
        }
    }

    const res = await errorResponse(forbidden(code));
    if (linkId) setConfirmCookie(res, linkId);
    return res;
}

export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { email, password } = await readBody(req, loginSchema);
    const release = await limitSignIn(req, email);
    const account = await verifyCredentials(email, password);
    await release();

    // Signing up ends with the emailed link: until the address is confirmed, the
    // password alone does not get in (see `needsEmailConfirmation`).
    const origin = emailLinkOrigin(req);
    if (origin && needsEmailConfirmation(account)) {
        return unconfirmedResponse(account.userId, email, origin);
    }

    const session = await createSession(account.userId);
    const user = await getSessionUser(account.userId, null);

    const res = NextResponse.json({ user });
    setSessionCookie(res, session);
    if (user) setLocaleCookie(res, user.locale);

    return res;
});
