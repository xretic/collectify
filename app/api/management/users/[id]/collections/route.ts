import { requireManagementAccess } from '@/entities/management/api/server';
import { isProperInteger } from '@/shared/lib/validation/isProperInteger';
import { prisma } from '@/shared/lib/prisma';
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

        const [collections, total] = await prisma.$transaction([
            prisma.collection.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: TAKE,
                select: {
                    id: true,
                    name: true,
                    category: true,
                    private: true,
                    createdAt: true,
                    _count: {
                        select: {
                            items: true,
                            comments: true,
                            likes: true,
                        },
                    },
                },
            }),
            prisma.collection.count({ where: { userId } }),
        ]);

        return NextResponse.json(
            {
                data: collections,
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
