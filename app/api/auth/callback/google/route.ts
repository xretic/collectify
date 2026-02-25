import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { generateUniqueUserId } from '@/helpers/generateUniqueUserId';
import { SESSION_AGE_IN_DAYS, USERNAME_MAX_LENGTH } from '@/lib/constans';
import { isUsernameValid } from '@/helpers/isUsernameValid';
import { Prisma } from '@/generated/prisma/client';
import ky from 'ky';

type GoogleTokenResponse = {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
};

type GoogleUserInfo = {
    id?: string;
    email?: string;
    verified_email?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
};

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const tokenData = await ky
            .post('https://oauth2.googleapis.com/token', {
                headers: { 'Content-Type': 'application/json' },
                json: {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `${url.origin}/api/auth/callback/google`,
                },
            })
            .json<GoogleTokenResponse>();

        if (tokenData.error || !tokenData.access_token) {
            return NextResponse.json(
                { error: tokenData.error_description || 'Failed to get token' },
                { status: 400 },
            );
        }

        const googleUser = await ky
            .get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            })
            .json<GoogleUserInfo>();

        if (!googleUser?.id || !googleUser?.email) {
            return NextResponse.json({ error: 'Invalid Google user' }, { status: 400 });
        }

        const googleId = String(googleUser.id);
        const email = String(googleUser.email);

        let user =
            (await prisma.user.findUnique({ where: { googleId } })) ??
            (await prisma.user.findUnique({ where: { email } }));

        if (!user) {
            const localPart = email.split('@')[0] || 'user';
            const base = localPart.slice(0, USERNAME_MAX_LENGTH);
            const uniqueId = await generateUniqueUserId();
            const baseUsername = isUsernameValid(base) ? base : String(uniqueId);

            const createUser = async (username: string) => {
                return prisma.user.create({
                    data: {
                        id: uniqueId,
                        email,
                        username,
                        fullName: googleUser.name || base,
                        avatarUrl: googleUser.picture || '',
                        googleId,
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
        } else if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId,
                    avatarUrl: googleUser.picture || user.avatarUrl,
                },
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
