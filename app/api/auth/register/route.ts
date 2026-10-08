import { after, NextResponse } from 'next/server';
import { conflict, json, readBody, route } from '@/shared/server/http';
import { enforceRateLimit, tryRateLimitFor } from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { resolveLocale } from '@/shared/i18n/request';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getSessionUser } from '@/entities/user/server/profile';
import { checkRegistration, createAccount, findEmailOwner } from '@/features/auth/server/accounts';
import { registerSchema } from '@/features/auth/model/schemas';
import {
    emailLinkOrigin,
    logEmailFailure,
    newLinkToken,
    requestEmailConfirmation,
    sendAccountExistsEmail,
    sendSignupFailedEmail,
    setConfirmCookie,
} from '@/features/auth/server/emailLinks';

/**
 * With email set up, the answer is the same whether or not the address already
 * has an account (202 "check your inbox", same work before answering, same
 * cookie), so the form cannot be used to find out who is registered. The rest
 * happens after the response: a new account is created and gets a confirmation
 * link, an existing one gets a note that it already exists.
 *
 * Without email (local setups) nothing could be confirmed, so the account is
 * signed in right away and a taken address is reported as before.
 */
export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    // `ageConfirmed` is enforced by the schema; the account records when the terms were accepted.
    const { email, username, password, locale } = await readBody(req, registerSchema);
    const input = {
        email,
        username,
        password,
        // Defaults to the language the visitor is browsing in.
        locale: locale ?? (await resolveLocale()),
    };

    const { passwordHash, existingUserId } = await checkRegistration(input);
    const origin = emailLinkOrigin(req);

    if (!origin) {
        if (existingUserId) throw conflict('emailTaken');

        const userId = await createAccount(input, passwordHash);
        if (!userId) {
            // Taken in the meantime: the check names which one (409 for a username).
            await checkRegistration(input);
            throw conflict('emailTaken');
        }

        const session = await createSession(userId);
        const user = await getSessionUser(userId, null);

        const res = NextResponse.json({ user }, { status: 201 });
        setSessionCookie(res, session);
        if (user) setLocaleCookie(res, user.locale);

        return res;
    }

    // Bound to this browser: opening the link here signs the new account in.
    const link = newLinkToken();

    after(async () => {
        try {
            if (existingUserId) {
                // At most one such note a day, so nobody can flood an inbox with them
                // or use up the address's reset and confirmation emails.
                if (await tryRateLimitFor(`notice:${email}`, 'notice')) {
                    await sendAccountExistsEmail(existingUserId, origin);
                }
                return;
            }

            const userId = await createAccount(input, passwordHash);
            if (!userId) {
                // Taken a moment ago: the address got an account (it gets the note), or
                // the username did (the registrant is asked to try another one).
                const owner = await findEmailOwner(email);
                if (owner) {
                    if (await tryRateLimitFor(`notice:${email}`, 'notice')) {
                        await sendAccountExistsEmail(owner.id, origin);
                    }
                } else if (await tryRateLimitFor(`email:${email}`, 'email')) {
                    await sendSignupFailedEmail(input, origin);
                }
                return;
            }

            // Over the limit, nothing is sent now; signing in sends the link later.
            const release = await tryRateLimitFor(`email:${email}`, 'email');
            if (!release) return;

            await requestEmailConfirmation(userId, origin, link).catch(async (error) => {
                await release();
                throw error;
            });
        } catch (error) {
            logEmailFailure(existingUserId ? 'account exists' : 'confirmation')(error);
        }
    });

    const res = json({ pending: true }, 202);
    setConfirmCookie(res, link.id);
    return res;
});
