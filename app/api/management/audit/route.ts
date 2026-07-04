import { requireManagementAccess } from '@/entities/management/api/server';
import { prisma } from '@/shared/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { response } = await requireManagementAccess(req);
        if (response) return response;

        const actions = await prisma.moderationAction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 60,
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                targetUser: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: actions }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
