import { requireManagementAccess } from '@/helpers/management';
import { isProperInteger } from '@/helpers/isProperInteger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const TAKE = 10;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const access = await requireManagementAccess(req);
        if (access.response) return access.response;

        const { id } = await params;
        const userId = Number(id);

        if (!isProperInteger(userId)) {
            return NextResponse.json({ message: 'Invalid user id.' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const skip = Number(searchParams.get('skip') ?? 0);

        if (!Number.isInteger(skip) || skip < 0) {
            return NextResponse.json({ message: 'skip must be a non-negative integer.' }, { status: 400 });
        }

        const [comments, total] = await prisma.$transaction([
            prisma.comment.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: TAKE,
                select: {
                    id: true,
                    text: true,
                    createdAt: true,
                    collectionId: true,
                    Collection: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.comment.count({ where: { userId } }),
        ]);

        return NextResponse.json(
            {
                data: comments,
                total,
                nextSkip: skip + TAKE < total ? skip + TAKE : null,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
