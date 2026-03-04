import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { sessionId } = await req.json();

    if (!sessionId) {
        return NextResponse.json({ message: 'sessionId is required field.' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
        where: {
            id: sessionId,
        },
    });

    if (!session) {
        return NextResponse.json({ message: 'Session not found.' }, { status: 404 });
    }

    const { id } = await params;
    const intId = Number(id);

    if (!isProperInteger(intId)) {
        return NextResponse.json({ message: 'Invalid chat id' }, { status: 400 });
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
        return NextResponse.json({ message: 'Chat not found.' }, { status: 404 });
    }

    if (!chat.users.some((x) => x.id === session.userId)) {
        return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Chat user verified.' }, { status: 200 });
}
