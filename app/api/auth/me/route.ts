import { prisma } from '@/lib/prisma';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const [followersCount, subscriptionsCount, notificationsCount] = await prisma.$transaction([
        prisma.follow.count({
            where: { followingId: session.userId },
        }),
        prisma.follow.count({
            where: { followerId: session.userId },
        }),
        prisma.notification.count({
            where: {
                recipientUserId: session.userId,
                isRead: false,
            },
        }),
    ]);

    const user: SessionUserInResponse = {
        id: session.user.id,
        avatarUrl: session.user.avatarUrl,
        bannerUrl: session.user.bannerUrl,
        username: session.user.username,
        fullName: session.user.fullName,
        description: session.user.description,
        followers: followersCount,
        subscriptions: subscriptionsCount,
        notifications: notificationsCount,
    };

    return NextResponse.json({ user: user }, { status: 200 });
}
