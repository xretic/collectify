import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;

    if (!sessionId) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const response = NextResponse.json(
        {
            user: {
                id: session.user.id,
                avatarUrl: session.user.avatarUrl,
                bannerUrl: session.user.bannerUrl,
                username: session.user.username,
                fullName: session.user.fullName,
                description: session.user.description,
            },
        },
        { status: 200 },
    );

    response.cookies.set({
        name: 'token',
        value: session.user.token,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 365,
    });

    return response;
}
