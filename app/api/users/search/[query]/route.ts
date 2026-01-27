import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ query: string }> }) {
    const { query } = await params;

    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const sessionUser = await prisma.user.findUnique({
        where: {
            token,
        },
    });

    if (!sessionUser) {
        return NextResponse.json({ user: null }, { status: 401 });
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
