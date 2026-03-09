import { isProperInteger } from '@/helpers/isProperInteger';
import { CHATS_PAGE_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { ChatInResponse } from '@/types/ChatInResponse';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { userId: true },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const skipRaw = searchParams.get('skip');

        if (skipRaw === null || !isProperInteger(Number(skipRaw))) {
            return NextResponse.json(
                { message: 'skip is required and must be integer.' },
                { status: 400 },
            );
        }

        const skip = Number(skipRaw);

        const chats = await prisma.chat.findMany({
            where: {
                users: { some: { id: session.userId } },
            },

            select: {
                id: true,
                createdAt: true,

                users: {
                    where: { id: { not: session.userId } },
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },

                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        content: true,
                        createdAt: true,
                    },
                },
            },

            orderBy: {
                createdAt: 'desc',
            },

            skip,
            take: CHATS_PAGE_LENGTH,
        });

        if (chats.length === 0) {
            return NextResponse.json({ data: [], total: 0 }, { status: 200 });
        }

        const chatIds = chats.map((c) => c.id);

        const unread = await prisma.message.groupBy({
            by: ['chatId'],
            where: {
                chatId: { in: chatIds },
                recipientUserId: session.userId,
                read: false,
            },
            _count: true,
        });

        const unreadMap = new Map(unread.map((x) => [x.chatId, x._count]));

        const response: ChatInResponse[] = chats
            .map((chat) => {
                const otherUser = chat.users.find((u) => u.id !== session.userId);

                if (!otherUser) return null;

                const lastMessage = chat.messages[0];

                return {
                    id: chat.id,
                    userId: otherUser.id,
                    username: otherUser.username,
                    userAvatarUrl: otherUser.avatarUrl,
                    previewContent: lastMessage?.content ?? '',
                    createdAt: chat.createdAt,
                    unread: unreadMap.get(chat.id) ?? 0,
                };
            })
            .filter(Boolean) as ChatInResponse[];

        response.sort((a, b) => {
            if (a.unread > 0 && b.unread === 0) return -1;
            if (a.unread === 0 && b.unread > 0) return 1;

            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        const total = await prisma.chat.count({
            where: {
                users: { some: { id: session.userId } },
            },
        });

        return NextResponse.json({ data: response, total });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
