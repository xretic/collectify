import { prisma } from '@/shared/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/shared/api/rateLimit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ query: string }> }) {
    try {
        const limited = await rateLimit(req, 'search');
        if (limited) return limited;

        const { query } = await params;

        const users = await prisma.user.findMany({
            where: {
                username: {
                    startsWith: query.toLowerCase(),
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
            return NextResponse.json({ users: [] }, { status: 200 });
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
