import { json, route } from '@/shared/server/http';
import { enforceRateLimit, enforceRateLimitFor } from '@/shared/server/rateLimit';
import { requireViewer } from '@/features/auth/server/guards';
import {
    requestEmailConfirmation,
    requireEmailLinkOrigin,
} from '@/features/auth/server/emailLinks';

/** Sends a new confirmation link to the signed-in user. */
export const POST = route(async (req) => {
    const viewer = await requireViewer(req);
    await enforceRateLimit(req, 'auth', viewer.userId);
    const release = await enforceRateLimitFor(`verification:${viewer.userId}`, 'email');

    try {
        const sent = await requestEmailConfirmation(viewer.userId, requireEmailLinkOrigin(req));
        // Nothing to confirm: no email went out.
        if (!sent) await release();
        return json({ sent });
    } catch (error) {
        // Our sending failed (e.g. email not configured): the attempt does not count.
        await release();
        throw error;
    }
});
