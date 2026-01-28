import { upsertNotification } from '@/helpers/upsertNotification';
import { prisma } from '@/lib/prisma';
import { SessionUserInResponse, UserInResponse } from '@/types/UserInResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const intId = Number(id);

    if (isNaN(intId)) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: intId },
    });

    if (!user) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    const followersCount = await prisma.follow.count({ where: { followingId: intId } });
    const subscriptionsCount = await prisma.follow.count({ where: { followerId: intId } });

    const sessionId = req.cookies.get('sessionId')?.value;
    let isFollowed = false;

    if (sessionId) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ data: null }, { status: 401 });
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
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const sessionId = req.cookies.get('sessionId')?.value;
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    const sessionUser = session!.user;

    const { id: idStr } = await context.params;
    const id = Number(idStr);

    if (isNaN(id)) {
        return NextResponse.json({ message: 'User id is not correct' }, { status: 400 });
    }

    const hasBody = req.headers.get('content-type')?.includes('application/json');

    const data = hasBody ? await req.json() : {};

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || user.id !== sessionUser.id) {
        return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    const safeData = filterAllowedFields(data);

    const { searchParams } = new URL(req.url);

    const followUserId = searchParams.get('followUserId');
    const followAction = searchParams.get('followAction');
    const isFollowAction = followUserId && followAction;

    if (Object.keys(safeData).length === 0 && !isFollowAction) {
        return NextResponse.json({ message: 'No allowed fields to update' }, { status: 400 });
    }

    if (safeData.username?.length === 0) {
        return NextResponse.json({ message: 'Username not set' }, { status: 400 });
    }

    if (safeData.fullName?.length === 0) {
        return NextResponse.json({ message: 'Fullname not set' }, { status: 400 });
    }

    if (safeData.username) {
        const usernameCheck = await prisma.user.findFirst({
            where: {
                username: safeData?.username,
            },
        });

        if (usernameCheck && usernameCheck.id !== id) {
            return NextResponse.json(
                { message: 'User with this username already exists.' },
                { status: 409 },
            );
        }
    }

    if (isFollowAction) {
        const follow = await prisma.follow.findFirst({
            where: {
                followerId: user.id,
                followingId: Number(followUserId),
            },
        });

        const invalidActionResponse = NextResponse.json(
            { message: 'Invalid action' },
            { status: 406 },
        );

        if ((follow && followAction === 'follow') || (!follow && followAction === 'unfollow')) {
            return invalidActionResponse;
        }

        if (Number(followUserId) === user.id) {
            return invalidActionResponse;
        }

        switch (followAction) {
            case 'follow':
                await prisma.follow.create({
                    data: {
                        followerId: user.id,
                        followingId: Number(followUserId),
                    },
                });

                await upsertNotification(user.id, Number(followUserId), 'FOLLOW');

                return NextResponse.json({ message: 'User followed.' }, { status: 200 });

            case 'unfollow':
                await prisma.follow.deleteMany({
                    where: {
                        followerId: user.id,
                        followingId: Number(followUserId),
                    },
                });

                return NextResponse.json({ message: 'User unfollowed.' }, { status: 200 });

            default:
                return invalidActionResponse;
        }
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: safeData,
        });

        const followersCount = await prisma.follow.count({ where: { followingId: id } });
        const subscriptionsCount = await prisma.follow.count({ where: { followerId: id } });
        const notificationsCount = await prisma.notification.count({
            where: { recipientUserId: id, isRead: false },
        });

        const responseData: SessionUserInResponse = {
            id: updatedUser.id,
            avatarUrl: updatedUser.avatarUrl,
            bannerUrl: updatedUser.bannerUrl,
            username: updatedUser.username,
            fullName: updatedUser.fullName,
            description: updatedUser.description,
            followers: followersCount,
            subscriptions: subscriptionsCount,
            notifications: notificationsCount,
        };

        return NextResponse.json(
            {
                message: `User ${id} updated.`,
                user: responseData,
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
    }
}

const BANNED_FIELDS = new Set(['id', 'email', 'passwordHash', 'sessions', 'followers']);

function filterAllowedFields<T extends Record<string, any>>(data: T) {
    return Object.fromEntries(Object.entries(data).filter(([key]) => !BANNED_FIELDS.has(key)));
}
