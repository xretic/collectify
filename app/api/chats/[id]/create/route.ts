import { isProperInteger } from '@/helpers/isProperInteger';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { publishChatMessage } from '@/server/socketBus';
import { MessageInResponse } from '@/types/ChatInResponse';
import { NextRequest, NextResponse } from 'next/server';
import { getScopedSanctionResponse } from '@/helpers/management';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
        }

        const sessionId = req.cookies.get('sessionId')?.value;

        if (!sessionId) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        const muteResponse = await getScopedSanctionResponse(session.userId, 'MESSENGER');

        if (muteResponse) {
            return muteResponse;
        }

        const user = await prisma.user.findUnique({
            where: {
                id: intId,
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        const { message } = await req.json();

        if (
            typeof message !== 'string' ||
            !message.trim() ||
            message.length > DIRECT_MESSAGE_MAX_LENGTH
        ) {
            return NextResponse.json(
                { message: 'First message is required to create a chat.' },
                { status: 400 },
            );
        }

        if (session.userId === user.id) {
            return NextResponse.json(
                { message: 'You cannot create chat with yourself.' },
                { status: 403 },
            );
        }

        const chatExistence = await prisma.chat.findFirst({
            where: {
                AND: [
                    { users: { some: { id: session.userId } } },
                    { users: { some: { id: user.id } } },
                ],
            },
        });

        if (chatExistence) {
            return NextResponse.json(
                { message: 'Chat with this user already exists.' },
                { status: 403 },
            );
        }

        const chat = await prisma.chat.create({
            data: {
                users: {
                    connect: [{ id: session.userId }, { id: user.id }],
                },
                messages: {
                    create: {
                        userId: session.userId,
                        recipientUserId: user.id,
                        content: message,
                    },
                },
            },
            include: {
                messages: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        const firstMessage = chat.messages[0];

        if (firstMessage) {
            const messageData: MessageInResponse = {
                id: firstMessage.id,
                userId: firstMessage.userId,
                userAvatarUrl: firstMessage.user.avatarUrl,
                username: firstMessage.user.username,
                content: firstMessage.content,
                createdAt: firstMessage.createdAt,
            };

            await publishChatMessage({
                chatId: chat.id,
                senderUserId: session.userId,
                recipientUserId: user.id,
                message: messageData,
            });
        }

        return NextResponse.json({ id: chat.id }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
