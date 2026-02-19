import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { ChatInResponse } from '@/types/ChatInResponse';
import { NextRequest, NextResponse } from 'next/server';

// get messages from chat

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid chat id' }, { status: 400 });
        }

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

        const chat = await prisma.chat.findUnique({
            where: {
                id: intId,
            },
            include: {
                users: true,
            },
        });

        if (!chat) {
            return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
        }

        if (!chat.users.some((x) => x.id === session.userId)) {
            return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
        }

        const messages = await prisma.message.findMany({
            where: {
                chatId: chat.id,
            },

            skip: skip,
        });

        if (messages.length === 0) {
            return NextResponse.json({ data: [] }, { status: 200 });
        }

        const user = chat.users.filter((x) => x.id !== session.userId)[0];

        const responseData: ChatInResponse = {
            id: chat.id,
            userId: user.id,
            userAvatarUrl: user.avatarUrl,
            username: user.username,
            createdAt: chat.createdAt,
            messages: messages.map((x) => ({
                id: x.id,
                userId: x.userId,
                content: x.content,
                createdAt: x.createdAt,
            })),
        };

        return NextResponse.json({ data: responseData }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
