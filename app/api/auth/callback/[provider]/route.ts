import { notFound, route } from '@/shared/server/http';
import { finishOAuth, OAUTH_PROVIDERS, type OAuthProvider } from '@/features/auth/server/oauth';

export const GET = route<{ provider: string }>(async (req, { provider }) => {
    if (!OAUTH_PROVIDERS.includes(provider as OAuthProvider)) throw notFound();

    return finishOAuth(req, provider as OAuthProvider);
});
