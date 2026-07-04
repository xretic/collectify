import { requireManagementAccess } from '@/entities/management/api/server';
import { prisma } from '@/shared/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const AUDIT_TAKE = 20;

export async function GET(req: NextRequest) {
    try {
        const { response } = await requireManagementAccess(req);
        if (response) return response;

        const { searchParams } = new URL(req.url);
        const userId = Number(searchParams.get('userId'));
        const skip = Number(searchParams.get('skip') ?? 0);

        if (!Number.isInteger(userId) || userId <= 0) {
            return NextResponse.json({ message: 'Valid userId is required.' }, { status: 400 });
        }

        if (!Number.isInteger(skip) || skip < 0) {
            return NextResponse.json(
                { message: 'skip must be a non-negative integer.' },
                { status: 400 },
            );
        }

        const where = {
            OR: [{ actorId: userId }, { targetUserId: userId }],
        };

        const actions = await prisma.moderationAction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: AUDIT_TAKE + 1,
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

        const hasMore = actions.length > AUDIT_TAKE;
        const data = hasMore ? actions.slice(0, AUDIT_TAKE) : actions;
        const nextSkip = hasMore ? skip + AUDIT_TAKE : null;

        return NextResponse.json({ data, nextSkip }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
