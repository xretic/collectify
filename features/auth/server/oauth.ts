import 'server-only';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db, isUniqueViolation } from '@/shared/server/db';
import { badRequest } from '@/shared/server/http';
import { isProduction, serverEnv } from '@/shared/server/env';
import { generateUserId } from '@/entities/user/server/generateUserId';
import { getActiveSanction } from '@/entities/sanction/server/sanctions';
import { createSession, setSessionCookie } from '@/entities/session/server/session';
import { usernameSchema } from '@/shared/lib/validation/schemas';
import { isLocale } from '@/shared/config/i18n';
import { resolveLocale } from '@/shared/i18n/request';
import { setLocaleCookie } from '@/shared/server/locale';
import { USERNAME_MAX_LENGTH } from '@/shared/lib/constants';

export type OAuthProvider = 'google' | 'github';

export const OAUTH_PROVIDERS: readonly OAuthProvider[] = ['google', 'github'];

const STATE_COOKIE = 'oauth_state';
const STATE_MAX_AGE_SECONDS = 10 * 60;

type OAuthProfile = {
    providerId: string;
    /** Only set when the provider says the address is verified. */
    verifiedEmail: string | null;
    login: string;
    fullName: string;
    avatarUrl: string;
};

export function appOrigin(req: NextRequest) {
    return serverEnv.APP_URL ?? req.nextUrl.origin;
}

function callbackUrl(req: NextRequest, provider: OAuthProvider) {
    return `${appOrigin(req)}/api/auth/callback/${provider}`;
}

function credentials(provider: OAuthProvider) {
    const id = provider === 'google' ? serverEnv.GOOGLE_CLIENT_ID : serverEnv.GITHUB_CLIENT_ID;
    const secret =
        provider === 'google' ? serverEnv.GOOGLE_CLIENT_SECRET : serverEnv.GITHUB_CLIENT_SECRET;

    if (!id || !secret) throw badRequest('oauthNotConfigured');

    return { id, secret };
}

/** Redirects to the provider with a CSRF `state` bound to a short-lived cookie. */
export function startOAuth(req: NextRequest, provider: OAuthProvider) {
    const { id } = credentials(provider);
    const state = randomBytes(24).toString('base64url');

    const url =
        provider === 'google'
            ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
            : new URL('https://github.com/login/oauth/authorize');

    url.searchParams.set('client_id', id);
    url.searchParams.set('redirect_uri', callbackUrl(req, provider));
    url.searchParams.set('state', state);

    if (provider === 'google') {
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'openid email profile');
        url.searchParams.set('prompt', 'select_account');
    } else {
        url.searchParams.set('scope', 'read:user user:email');
    }

    const res = NextResponse.redirect(url);
    res.cookies.set({
        name: STATE_COOKIE,
        value: state,
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/api/auth/callback',
        maxAge: STATE_MAX_AGE_SECONDS,
    });

    return res;
}

function stateMatches(req: NextRequest) {
    const expected = req.cookies.get(STATE_COOKIE)?.value;
    const actual = req.nextUrl.searchParams.get('state');
    if (!expected || !actual || expected.length !== actual.length) return false;

    return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

async function postForm<T>(url: string, body: Record<string, string>): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body),
    });

    if (!res.ok) throw new Error(`OAuth token exchange failed: ${res.status}`);
    return res.json() as Promise<T>;
}

async function getJson<T>(url: string, token: string): Promise<T> {
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`OAuth profile request failed: ${res.status}`);
    return res.json() as Promise<T>;
}

async function fetchGoogleProfile(req: NextRequest, code: string): Promise<OAuthProfile> {
    const { id, secret } = credentials('google');

    const token = await postForm<{ access_token?: string }>('https://oauth2.googleapis.com/token', {
        client_id: id,
        client_secret: secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl(req, 'google'),
    });

    if (!token.access_token) throw new Error('Google did not return an access token.');

    const user = await getJson<{
        id: string;
        email?: string;
        verified_email?: boolean;
        name?: string;
        picture?: string;
    }>('https://www.googleapis.com/oauth2/v2/userinfo', token.access_token);

    return {
        providerId: String(user.id),
        verifiedEmail: user.email && user.verified_email ? user.email.toLowerCase() : null,
        login: user.email?.split('@')[0] ?? '',
        fullName: user.name ?? '',
        avatarUrl: user.picture ?? '',
    };
}

async function fetchGithubProfile(req: NextRequest, code: string): Promise<OAuthProfile> {
    const { id, secret } = credentials('github');

    const token = await postForm<{ access_token?: string }>(
        'https://github.com/login/oauth/access_token',
        { client_id: id, client_secret: secret, code, redirect_uri: callbackUrl(req, 'github') },
    );

    if (!token.access_token) throw new Error('GitHub did not return an access token.');

    const [user, emails] = await Promise.all([
        getJson<{ id: number; login: string; name: string | null; avatar_url: string }>(
            'https://api.github.com/user',
            token.access_token,
        ),
        getJson<{ email: string; primary: boolean; verified: boolean }[]>(
            'https://api.github.com/user/emails',
            token.access_token,
        ),
    ]);

    const email =
        emails.find((item) => item.primary && item.verified) ??
        emails.find((item) => item.verified);

    return {
        providerId: String(user.id),
        verifiedEmail: email?.email.toLowerCase() ?? null,
        login: user.login,
        fullName: user.name ?? user.login,
        avatarUrl: user.avatar_url,
    };
}

function usernameCandidate(login: string, fallback: number) {
    const base = login
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '')
        .slice(0, USERNAME_MAX_LENGTH);
    return usernameSchema.safeParse(base).success
        ? base
        : `user${fallback}`.slice(0, USERNAME_MAX_LENGTH);
}

/** Returns the account id and whether it was just created (new accounts get onboarding). */
async function findOrCreateUser(
    provider: OAuthProvider,
    profile: OAuthProfile,
): Promise<{ id: number; created: boolean; locale: string }> {
    const providerField = provider === 'google' ? 'googleId' : 'githubId';

    const linked = await db.user.findFirst({
        where: { [providerField]: profile.providerId },
        select: { id: true, locale: true },
    });
    if (linked) return { ...linked, created: false };

    // Link to an existing account only through a provider-verified email.
    if (profile.verifiedEmail) {
        const byEmail = await db.user.findFirst({
            where: { email: { equals: profile.verifiedEmail, mode: 'insensitive' } },
            select: { id: true, avatarUrl: true, locale: true },
        });

        if (byEmail) {
            await db.user.update({
                where: { id: byEmail.id },
                data: {
                    [providerField]: profile.providerId,
                    avatarUrl: byEmail.avatarUrl || profile.avatarUrl,
                },
            });
            return { id: byEmail.id, created: false, locale: byEmail.locale };
        }
    }

    const id = await generateUserId();
    // New accounts keep the language the visitor was browsing in.
    const locale = await resolveLocale();
    const data = {
        id,
        email:
            profile.verifiedEmail ?? `${provider}_${profile.providerId}@users.noreply.collectify`,
        fullName: (profile.fullName || profile.login || 'User').slice(0, 30),
        avatarUrl: profile.avatarUrl,
        [providerField]: profile.providerId,
        locale,
    };

    try {
        await db.user.create({ data: { ...data, username: usernameCandidate(profile.login, id) } });
    } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        await db.user.create({
            data: { ...data, username: `user${id}`.slice(0, USERNAME_MAX_LENGTH) },
        });
    }

    return { id, created: true, locale };
}

/** Handles the provider redirect: verifies state, signs the user in, redirects home. */
export async function finishOAuth(req: NextRequest, provider: OAuthProvider) {
    const home = new URL('/', appOrigin(req));
    const fail = (error: string) => {
        const res = NextResponse.redirect(new URL(`/auth/login?error=${error}`, appOrigin(req)));
        res.cookies.delete({ name: STATE_COOKIE, path: '/api/auth/callback' });
        return res;
    };

    const code = req.nextUrl.searchParams.get('code');
    if (!code || !stateMatches(req)) return fail('oauth-state');

    let userId: number;
    let created: boolean;
    let locale: string;

    try {
        const profile =
            provider === 'google'
                ? await fetchGoogleProfile(req, code)
                : await fetchGithubProfile(req, code);

        ({ id: userId, created, locale } = await findOrCreateUser(provider, profile));
    } catch (error) {
        console.error(`[oauth:${provider}]`, error);
        return fail('oauth-failed');
    }

    if (await getActiveSanction(userId, 'ACCOUNT')) return fail('account-banned');

    const session = await createSession(userId);
    const res = NextResponse.redirect(created ? new URL('/onboarding', home) : home);
    res.cookies.delete({ name: STATE_COOKIE, path: '/api/auth/callback' });
    setSessionCookie(res, session);
    if (isLocale(locale)) setLocaleCookie(res, locale);

    return res;
}
