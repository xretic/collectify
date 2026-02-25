import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { generateUniqueUserId } from '@/helpers/generateUniqueUserId';
import { SESSION_AGE_IN_DAYS, USERNAME_MAX_LENGTH } from '@/lib/constans';
import { isUsernameValid } from '@/helpers/isUsernameValid';
import { Prisma } from '@/generated/prisma/client';
import ky from 'ky';

interface GithubUser {
    id: number;
    login: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
}

interface GithubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility?: string | null;
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const tokenData = await ky
            .post('https://github.com/login/oauth/access_token', {
                headers: { Accept: 'application/json' },
                json: {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    ...(state ? { state } : {}),
                },
            })
            .json<{ access_token?: string; error?: string; error_description?: string }>();

        if (tokenData.error) {
            return NextResponse.json(
                { error: tokenData.error_description || 'Failed to get token' },
                { status: 400 },
            );
        }

        const accessToken = tokenData.access_token;
        if (!accessToken) {
            return NextResponse.json({ error: 'No access token' }, { status: 400 });
        }

        const githubUser = await ky
            .get('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github+json',
                },
            })
            .json<GithubUser>();

        if (!githubUser?.id || !githubUser?.login) {
            return NextResponse.json({ error: 'Failed to fetch GitHub user' }, { status: 400 });
        }

        let email: string | null = githubUser.email ?? null;

        if (!email) {
            const emails = await ky
                .get('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/vnd.github+json',
                    },
                })
                .json<GithubEmail[]>();

            email =
                emails.find((e) => e.primary && e.verified)?.email ??
                emails.find((e) => e.verified)?.email ??
                null;
        }

        const githubId = String(githubUser.id);

        let user =
            (await prisma.user.findUnique({ where: { githubId } })) ??
            (email ? await prisma.user.findUnique({ where: { email } }) : null);

        if (!user) {
            const uniqueId = await generateUniqueUserId();
            const base = githubUser.login.slice(0, USERNAME_MAX_LENGTH);
            const baseUsername = isUsernameValid(base) ? base : String(uniqueId);

            const createUser = async (username: string) => {
                return prisma.user.create({
                    data: {
                        id: uniqueId,
                        email: email ?? `github_${githubId}@no-email.local`,
                        username,
                        fullName: githubUser.name || base,
                        avatarUrl: githubUser.avatar_url || '',
                        githubId,
                    },
                });
            };

            try {
                user = await createUser(baseUsername);
            } catch (e: any) {
                if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                    user = await createUser(String(uniqueId));
                } else {
                    throw e;
                }
            }
        } else if (!user.githubId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { githubId, avatarUrl: githubUser.avatar_url || user.avatarUrl },
            });
        }

        const session = await prisma.session.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        const response = NextResponse.redirect(new URL('/', req.url));

        response.cookies.set({
            name: 'sessionId',
            value: session.id,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * SESSION_AGE_IN_DAYS,
        });

        return response;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
