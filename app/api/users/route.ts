import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { SessionUserInResponse } from '@/types/UserInResponse';
import { upsertNotification } from '@/helpers/upsertNotification';
import { FULLNAME_MAX_LENGTH } from '@/lib/constans';
import { isUsernameValid } from '@/helpers/isUsernameValid';
import { getSessionUserResponse } from '@/helpers/getSessionUserResponse';

export async function DELETE(req: NextRequest) {
    try {
        const hasBody = req.headers.get('content-type')?.includes('application/json');

        if (!hasBody) {
            return NextResponse.json({ status: 400 });
        }

        const data = await req.json();

        if (!data.password) {
            return NextResponse.json({ status: 400 });
        }

        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        if (session?.user.passwordHash) {
            const passwordMatch = await bcrypt.compare(data.password, session.user.passwordHash);

            if (!passwordMatch) {
                return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
            }
        }

        await prisma.user.delete({
            where: {
                id: session.userId,
            },
        });

        const res = NextResponse.json({ status: 200 });

        res.cookies.delete('sessionId');

        return res;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                user: true,
            },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const sessionUser = session.user;

        const { searchParams } = new URL(req.url);

        const followUserId = searchParams.get('followUserId');
        const followAction = searchParams.get('followAction');
        const isFollowAction = followUserId && followAction;

        if (isFollowAction) {
            const follow = await prisma.follow.findFirst({
                where: {
                    followerId: sessionUser.id,
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

            if (Number(followUserId) === sessionUser.id) {
                return invalidActionResponse;
            }

            switch (followAction) {
                case 'follow':
                    await prisma.follow.create({
                        data: {
                            followerId: sessionUser.id,
                            followingId: Number(followUserId),
                        },
                    });

                    await upsertNotification(sessionUser.id, Number(followUserId), 'FOLLOW');

                    return NextResponse.json({ message: 'User followed.' }, { status: 200 });

                case 'unfollow':
                    await prisma.follow.deleteMany({
                        where: {
                            followerId: sessionUser.id,
                            followingId: Number(followUserId),
                        },
                    });

                    return NextResponse.json({ message: 'User unfollowed.' }, { status: 200 });

                default:
                    return invalidActionResponse;
            }
        }

        const hasBody = req.headers.get('content-type')?.includes('application/json');

        if (!hasBody) {
            return NextResponse.json({ status: 400 });
        }

        const data = await req.json();

        const safeData = filterAllowedFields(data);

        if (Object.keys(safeData).length === 0) {
            return NextResponse.json({ message: 'No allowed fields to update' }, { status: 400 });
        }

        if (safeData.fullName?.length === 0 || !isUsernameValid(safeData.username)) {
            return NextResponse.json(
                { message: 'The username is not set or contains prohibited characters.' },
                { status: 400 },
            );
        }

        if (
            safeData.fullName?.length === 0 ||
            !safeData.fullName.trim() ||
            safeData.fullName.length > FULLNAME_MAX_LENGTH
        ) {
            return NextResponse.json(
                { message: 'Full name is not set or contains prohibited characters' },
                { status: 400 },
            );
        }

        if (safeData.username) {
            const usernameCheck = await prisma.user.findUnique({
                where: {
                    username: safeData?.username,
                },
            });

            if (usernameCheck && usernameCheck.id !== sessionUser.id) {
                return NextResponse.json(
                    { message: 'User with this username already exists.' },
                    { status: 409 },
                );
            }
        }

        try {
            const updatedUser = await prisma.user.update({
                where: { id: sessionUser.id },
                data: safeData,
            });

            const userInResponse: SessionUserInResponse = await getSessionUserResponse(updatedUser);

            return NextResponse.json(
                {
                    message: `Session user updated.`,
                    user: userInResponse,
                },
                { status: 200 },
            );
        } catch (error) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

const BANNED_FIELDS = new Set([
    'id',
    'email',
    'passwordHash',
    'sessions',
    'followers',
    'githubId',
    'googleId',
    'collections',
    'favorites',
    'notifications',
    'Notification',
]);

function filterAllowedFields<T extends Record<string, any>>(data: T) {
    return Object.fromEntries(Object.entries(data).filter(([key]) => !BANNED_FIELDS.has(key)));
}
