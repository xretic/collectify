import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { NOTIFICATIONS_PER_LOAD } from '../../../lib/constans';
import { NotificationInResponse } from '@/types/NotificationInResponse';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const onlyUnread = searchParams.get('onlyUnread');

        if (onlyUnread !== 'true' && onlyUnread !== 'false') {
            return NextResponse.json(
                { message: 'Option onlyUnread is required and must be true or false.' },
                { status: 400 },
            );
        }

        const onlyUnreadBool = onlyUnread === 'true';

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

        const notifications = await prisma.notification.findMany({
            where: {
                recipientUserId: sessionUser.id,
                ...(onlyUnreadBool ? { isRead: false } : {}),
            },
            include: {
                senderUser: true,
                collection: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: NOTIFICATIONS_PER_LOAD,
        });

        const [totalAmount, unreadAmount] = await prisma.$transaction([
            prisma.notification.count({
                where: { recipientUserId: sessionUser.id },
            }),

            prisma.notification.count({
                where: { recipientUserId: sessionUser.id, isRead: false },
            }),
        ]);

        const data: NotificationInResponse[] = notifications.map((x) => ({
            user: {
                id: x.senderUserId,
                avatarUrl: x.senderUser?.avatarUrl,
                username: x.senderUser?.username,
            },
            notification: {
                type: x.type,
                recipientUserId: x.recipientUserId,
                senderUserId: x.senderUserId,
                isRead: x.isRead,
                createdAt: x.createdAt,
                collectionId: x.collectionId,
                collectionName: x.collection?.name ?? null,
            },
        }));

        return NextResponse.json(
            { data: data, totalAmount: totalAmount, unreadAmount: unreadAmount },
            { status: 200 },
        );
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

        await prisma.notification.updateMany({
            where: {
                recipientUserId: sessionUser.id,
            },
            data: {
                isRead: true,
            },
        });

        const notifications = await prisma.notification.findMany({
            where: {
                recipientUserId: sessionUser.id,
            },
            include: {
                senderUser: true,
                collection: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: NOTIFICATIONS_PER_LOAD,
        });

        const data: NotificationInResponse[] = notifications.map((x) => ({
            user: {
                id: x.senderUserId,
                avatarUrl: x.senderUser?.avatarUrl,
                username: x.senderUser?.username,
            },
            notification: {
                type: x.type,
                recipientUserId: x.recipientUserId,
                senderUserId: x.senderUserId,
                isRead: x.isRead,
                createdAt: x.createdAt,
                collectionId: x.collectionId,
                collectionName: x.collection?.name ?? null,
            },
        }));

        return NextResponse.json({ data: data }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
