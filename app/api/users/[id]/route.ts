import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { UserInResponse } from '@/types/UserInResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: intId },
        });

        if (!user) {
            return NextResponse.json({ user: null }, { status: 404 });
        }

        const [followersCount, subscriptionsCount] = await prisma.$transaction([
            prisma.follow.count({
                where: { followingId: intId },
            }),
            prisma.follow.count({
                where: { followerId: intId },
            }),
        ]);

        const sessionId = req.cookies.get('sessionId')?.value;
        let isFollowed = false;

        if (sessionId) {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
            });

            if (!session) {
                return NextResponse.json({ status: 401 });
            }

            const followCheck = await prisma.follow.findFirst({
                where: {
                    followerId: session.userId,
                    followingId: user.id,
                },
            });

            isFollowed = !!followCheck;
        }

        const responseData: UserInResponse = {
            id: user.id,
            avatarUrl: user.avatarUrl,
            bannerUrl: user.bannerUrl,
            username: user.username,
            fullName: user.fullName,
            description: user.description,
            followers: followersCount,
            subscriptions: subscriptionsCount,
            sessionUserIsFollowed: isFollowed,
        };

        return NextResponse.json(
            {
                user: responseData,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
