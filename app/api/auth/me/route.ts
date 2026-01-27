import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;

    if (!sessionId) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const followersCount = await prisma.follow.count({ where: { followingId: session.userId } });
    const subscriptionsCount = await prisma.follow.count({ where: { followerId: session.userId } });

    const user: SessionUserInResponse = {
        id: session.user.id,
        avatarUrl: session.user.avatarUrl,
        bannerUrl: session.user.bannerUrl,
        username: session.user.username,
        fullName: session.user.fullName,
        description: session.user.description,
        followers: followersCount,
        subscriptions: subscriptionsCount,
    };

    return NextResponse.json({ user: user }, { status: 200 });
}
