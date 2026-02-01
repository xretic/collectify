import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_: NextRequest, { params }: { params: Promise<{ query: string }> }) {
    try {
        const { query } = await params;

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
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
