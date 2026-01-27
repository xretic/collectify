import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { generateUniqueUserId } from '@/helpers/generateUniqueUserId';
import { USERNAME_MAX_LENGTH } from '@/lib/constans';
import { isUsernameValid } from '@/helpers/isUsernameValid';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${url.origin}/api/auth/callback/google`,
            }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return NextResponse.json({ error: 'Failed to get token' }, { status: 400 });
        }

        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const googleUser = await userRes.json();

        if (!googleUser?.id || !googleUser?.email) {
            return NextResponse.json({ error: 'Invalid Google user' }, { status: 400 });
        }

        let user = await prisma.user.findFirst({
            where: {
                OR: [{ googleId: googleUser.id }, { email: googleUser.email }],
            },
        });

        if (!user) {
            const splitedEmail = googleUser.email.split('@')[0];
            const username = splitedEmail.slice(0, USERNAME_MAX_LENGTH);

            const uniqueId = await generateUniqueUserId();
            const notAvailable = await prisma.user.findFirst({
                where: {
                    username: username,
                },
            });

            user = await prisma.user.create({
                data: {
                    id: uniqueId,
                    email: googleUser.email,
                    username:
                        notAvailable || !isUsernameValid(username) ? String(uniqueId) : username,
                    fullName: googleUser.name,
                    avatarUrl: googleUser.picture,
                    googleId: googleUser.id,
                },
            });
        } else if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: googleUser.id,
                    avatarUrl: googleUser.picture,
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
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
