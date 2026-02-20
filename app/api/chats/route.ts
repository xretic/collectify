import { isProperInteger } from '@/helpers/isProperInteger';
import { CHATS_PAGE_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { ChatInResponse } from '@/types/ChatInResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const skipRaw = searchParams.get('skip');

        if (skipRaw === null) {
            return NextResponse.json({ message: 'skip is required.' }, { status: 400 });
        }

        const skip = Number(searchParams.get('skip'));

        if (!isProperInteger(skip)) {
            return NextResponse.json(
                {
                    message: 'skip option is required.',
                },
                { status: 400 },
            );
        }

        const chats = await prisma.chat.findMany({
            where: {
                users: {
                    some: {
                        id: session.userId,
                    },
                },
            },
            include: {
                users: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { content: true, createdAt: true },
                },
            },
            take: CHATS_PAGE_LENGTH,
            skip,
        });

        if (chats.length === 0) {
            return NextResponse.json({ data: [] }, { status: 200 });
        }

        const chatsCount = await prisma.chat.count({
            where: {
                users: {
                    some: {
                        id: session.userId,
                    },
                },
            },
        });

        const chatIds = chats.map((c) => c.id);

        const unreadGrouped = await prisma.message.groupBy({
            by: ['chatId'],
            where: {
                chatId: { in: chatIds },
                recipientUserId: session.userId,
                read: false,
            },
            _count: { _all: true },
        });

        const unreadMap = new Map<number, number>(
            unreadGrouped.map((x) => [x.chatId, x._count._all]),
        );

        chats.sort((a, b) => {
            const ua = unreadMap.get(a.id) ?? 0;
            const ub = unreadMap.get(b.id) ?? 0;

            if (ub !== ua) return ub - ua;

            const at = a.messages[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : 0;
            const bt = b.messages[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : 0;

            return bt - at;
        });

        const response: ChatInResponse[] = chats.map((x) => {
            const otherUser = x.users.find((u) => u.id !== session.userId)!;

            return {
                id: x.id,
                userId: otherUser.id,
                userAvatarUrl: otherUser.avatarUrl,
                username: otherUser.username,
                previewContent: x.messages.length ? x.messages[0].content : '',
                createdAt: x.createdAt,
                unread: unreadMap.get(x.id) ?? 0,
            };
        });

        return NextResponse.json({ data: response, total: chatsCount }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
