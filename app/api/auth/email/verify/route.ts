import { NextResponse } from 'next/server';
import { conflict, readBody, route } from '@/shared/server/http';
import { enforceRateLimit, enforceRateLimitFor } from '@/shared/server/rateLimit';
import { setLocaleCookie } from '@/shared/server/locale';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { getActiveSanction } from '@/entities/sanction/server/sanctions';
import { getSessionUser } from '@/entities/user/server/profile';
import { getViewer } from '@/features/auth/server/guards';
import { assertPassword } from '@/features/auth/server/accounts';
import {
    clearConfirmCookie,
    confirmEmail,
    isConfirmingBrowser,
    linkOwner,
} from '@/features/auth/server/emailLinks';
import { verifyEmailSchema } from '@/features/auth/model/schemas';

/**
 * Confirms the address and signs the account in. Having the link proves the
 * mailbox; the account must also be proven its own: the link is opened in the
 * browser that signed up (or typed the right password), or the password is
 * given here. Otherwise nothing happens (409 `confirmWithPassword`), so a
 * confirmation mail its reader did not ask for (an account someone else
 * created with their address) can neither be confirmed nor sign them in.
 *
 * A browser already signed in to another account keeps it (204).
 */
export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { token, password } = await readBody(req, verifyEmailSchema);

    if (!isConfirmingBrowser(req, token)) {
        const owner = await linkOwner(token, 'EMAIL_VERIFICATION');
        if (!password) throw conflict('confirmWithPassword');

        // Guesses against the account are limited like sign-ins.
        await enforceRateLimitFor(`confirm:${owner}`, 'login');
        await assertPassword(owner, password);
    }

    const userId = await confirmEmail(token);

    const signIn = !(await getViewer(req)) && !(await getActiveSanction(userId, 'ACCOUNT'));

    let res: NextResponse;
    if (signIn) {
        const session = await createSession(userId);
        const user = await getSessionUser(userId, null);

        res = NextResponse.json({ user });
        setSessionCookie(res, session);
        if (user) setLocaleCookie(res, user.locale);
    } else {
        res = new NextResponse(null, { status: 204 });
    }

    clearConfirmCookie(res);
    return res;
});
