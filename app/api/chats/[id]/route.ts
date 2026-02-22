import { isProperInteger } from '@/helpers/isProperInteger';
import { MESSAGES_PAGE_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { ChatInResponse, MessageInResponse } from '@/types/ChatInResponse';
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
        const cursorRaw = searchParams.get('cursor');

        let cursor: number | null = null;

        if (cursorRaw !== null) {
            const parsed = Number(cursorRaw);

            if (!isProperInteger(parsed)) {
                return NextResponse.json({ message: 'Invalid cursor.' }, { status: 400 });
            }

            cursor = parsed;
        }

        const chat = await prisma.chat.findUnique({
            where: { id: intId },
            include: { users: true },
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
                ...(cursor
                    ? {
                          id: { lt: cursor },
                      }
                    : {}),
            },
            orderBy: {
                id: 'desc',
            },
            include: { user: true },
            take: MESSAGES_PAGE_LENGTH,
        });

        const nextCursor =
            messages.length === MESSAGES_PAGE_LENGTH ? messages[messages.length - 1].id : null;

        const user = chat.users.filter((x) => x.id !== session.userId)[0];

        const unread = await prisma.message.count({
            where: {
                chatId: chat.id,
                recipientUserId: session.userId,
                read: false,
            },
        });

        const responseData: ChatInResponse = {
            id: chat.id,
            userId: user.id,
            userAvatarUrl: user.avatarUrl,
            username: user.username,
            createdAt: chat.createdAt,
            unread,
            messages: messages.map((x) => ({
                id: x.id,
                userId: x.userId,
                userAvatarUrl: x.user.avatarUrl,
                username: x.user.username,
                content: x.content,
                createdAt: x.createdAt,
            })),
        };

        return NextResponse.json({ data: responseData, nextCursor }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { messageText } = await req.json();

        if (!messageText || !messageText.trim()) {
            return NextResponse.json({ message: 'Message text is required.' }, { status: 400 });
        }

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

        const message = await prisma.message.create({
            data: {
                chatId: chat.id,
                userId: session.userId,
                recipientUserId: chat.users.filter((x) => x.id !== session.userId)[0].id,
                content: messageText,
            },

            include: { user: true },
        });

        const messageData: MessageInResponse = {
            id: message.id,
            userId: message.userId,
            userAvatarUrl: message.user.avatarUrl,
            username: message.user.username,
            content: message.content,
            createdAt: message.createdAt,
        };

        const publishUrl = process.env.SOCKET_PUBLISH_URL;

        if (publishUrl) {
            const base = (process.env.SOCKET_PUBLISH_URL ?? '').replace(/\/+$/, '');
            await fetch(base + '/publish/message', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ chatId: chat.id, message: messageData }),
            });
        }

        return NextResponse.json({ data: messageData }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        await prisma.message.updateMany({
            where: {
                chatId: chat.id,
                recipientUserId: session.userId,
                read: false,
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({ message: 'Chat is updated.' }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
