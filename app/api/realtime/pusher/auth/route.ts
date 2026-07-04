import { prisma } from '@/shared/lib/prisma';
import { pusher, userChannelName } from '@/server/realtime/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    if (!pusher) {
        return NextResponse.json(
            { message: 'Realtime provider is not configured.' },
            { status: 503 },
        );
    }

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

    const formData = await req.formData();
    const socketId = String(formData.get('socket_id') ?? '');
    const channelName = String(formData.get('channel_name') ?? '');

    if (!socketId || channelName !== userChannelName(session.userId)) {
        return NextResponse.json({ message: 'Forbidden.' }, { status: 403 });
    }

    return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
}
