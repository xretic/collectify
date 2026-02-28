import { isProperInteger } from '@/helpers/isProperInteger';
import { DIRECT_MESSAGE_MAX_LENGTH } from '@/lib/constans';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
        }

        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
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
            select: { id: true },
        });

        return NextResponse.json({ id: chat.id }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
