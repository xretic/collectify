import { after } from 'next/server';
import { noContent, readBody, route } from '@/shared/server/http';
import { enforceRateLimit, enforceRateLimitFor } from '@/shared/server/rateLimit';
import {
    logEmailFailure,
    requestPasswordReset,
    requireEmailLinkOrigin,
} from '@/features/auth/server/emailLinks';
import { forgotPasswordSchema } from '@/features/auth/model/schemas';

export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { email } = await readBody(req, forgotPasswordSchema);
    // Keyed by the address whether or not it has an account, so the limit reveals nothing.
    await enforceRateLimitFor(`email:${email}`, 'email');
    const origin = requireEmailLinkOrigin(req);

    // After the response: it looks and takes the same whether or not the account exists.
    after(() => requestPasswordReset(email, origin).catch(logEmailFailure('password reset')));

    return noContent();
});
