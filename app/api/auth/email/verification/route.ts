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
    await enforceRateLimitFor(`verification:${viewer.userId}`, 'email');

    const sent = await requestEmailConfirmation(viewer.userId, requireEmailLinkOrigin(req));

    return json({ sent });
});
