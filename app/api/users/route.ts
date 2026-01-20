import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const requestUser = await prisma.user.findUnique({
        where: {
            token,
        },
    });

    if (!requestUser) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const users = await prisma.user.findMany();

    if (users.length === 0) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json(
        {
            users: users.map((user) => ({
                id: user.id,
                avatarUrl: user.avatarUrl,
                bannerUrl: user.bannerUrl,
                username: user.username,
                fullName: user.fullName,
                description: user.description,
            })),
        },
        { status: 200 },
    );
}
