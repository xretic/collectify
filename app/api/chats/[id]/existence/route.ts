import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const intId = Number(id);

        if (!isProperInteger(intId)) {
            return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: intId,
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'User does not exist.' }, { status: 404 });
        }

        const sessionId = req.cookies.get('sessionId')?.value;
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
        }

        if (session.userId === user.id) {
            return NextResponse.json({ result: false }, { status: 200 });
        }

        const chat = await prisma.chat.findFirst({
            where: {
                AND: [
                    { users: { some: { id: session.userId } } },
                    { users: { some: { id: user.id } } },
                ],
            },
        });

        if (!chat) {
            return NextResponse.json({ result: false }, { status: 200 });
        }

        return NextResponse.json({ chatId: chat.id, result: true }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
