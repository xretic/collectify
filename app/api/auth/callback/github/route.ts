import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { generateAuthToken } from '@/helpers/generateAuthToken';
import { generateRandomId } from '@/helpers/generateRandomId';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'No code provided' }, { status: 400 });
        }

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            return NextResponse.json(
                { error: tokenData.error_description || 'Failed to get token' },
                { status: 400 },
            );
        }

        const accessToken = tokenData.access_token;

        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: 'application/json',
            },
        });

        const githubUser = await userRes.json();

        if (!githubUser || !githubUser.id) {
            return NextResponse.json({ error: 'Failed to fetch GitHub user' }, { status: 400 });
        }

        let user = await prisma.user.findFirst({
            where: { githubId: githubUser.id.toString() },
        });

        if (!user && githubUser.email) {
            user = await prisma.user.findFirst({
                where: { email: githubUser.email },
            });
        }

        if (!user) {
            const token = await generateAuthToken();
            const uniqueId = await generateRandomId();

            user = await prisma.user.create({
                data: {
                    id: uniqueId,
                    email: githubUser.email || `github_${githubUser.id}@example.com`,
                    username: githubUser.login,
                    fullName: githubUser.name || githubUser.login,
                    avatarUrl: githubUser.avatar_url,
                    githubId: githubUser.id.toString(),
                    token,
                },
            });
        } else {
            if (!user.githubId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { githubId: githubUser.id.toString(), avatarUrl: githubUser.avatar_url },
                });
            }
        }

        const session = await prisma.session.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
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

        response.cookies.set({
            name: 'token',
            value: user.token,
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365,
        });

        return response;
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
