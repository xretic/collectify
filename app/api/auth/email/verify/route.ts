import { noContent, readBody, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { confirmEmail } from '@/features/auth/server/emailLinks';
import { verifyEmailSchema } from '@/features/auth/model/schemas';

/** Works without a session: the link may be opened in another browser. */
export const POST = route(async (req) => {
    await enforceRateLimit(req, 'auth');

    const { token } = await readBody(req, verifyEmailSchema);
    await confirmEmail(token);

    return noContent();
});
