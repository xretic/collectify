import { prisma } from '@/libs/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    const sessionId = req.cookies.get('sessionId')?.value;

    if (!sessionId) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json(
        {
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                avatarUrl: session.user.avatarUrl,
            },
        },
        { status: 200 },
    );
}
