import { notFound, route } from '@/shared/server/http';
import { enforceRateLimit } from '@/shared/server/rateLimit';
import { OAUTH_PROVIDERS, startOAuth, type OAuthProvider } from '@/features/auth/server/oauth';

export const GET = route<{ provider: string }>(async (req, { provider }) => {
    if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) throw notFound();

    await enforceRateLimit(req, 'auth');

    return startOAuth(req, provider as OAuthProvider);
});
