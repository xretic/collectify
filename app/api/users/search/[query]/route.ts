import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ query: string }> }) {
    const { query } = await params;

    const sessionId = req.cookies.get('sessionId')?.value;

    if (!sessionId) {
        return NextResponse.json({ status: 401 });
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
        },
    });

    if (!session) {
        return NextResponse.json({ status: 401 });
    }

    const users = await prisma.user.findMany({
        where: {
            username: {
                startsWith: query,
                mode: 'insensitive',
            },
        },
        take: 5,
        select: {
            id: true,
            avatarUrl: true,
            username: true,
        },
    });

    if (users.length === 0) {
        return NextResponse.json({ users: [] }, { status: 404 });
    }

    return NextResponse.json(
        {
            users: users.map((user) => ({
                id: user.id,
                avatarUrl: user.avatarUrl,
                username: user.username,
            })),
        },
        { status: 200 },
    );
}
