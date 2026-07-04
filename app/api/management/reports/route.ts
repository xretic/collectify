import { requireManagementAccess } from '@/helpers/management';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const REPORTS_TAKE = 20;

export async function GET(req: NextRequest) {
    try {
        const access = await requireManagementAccess(req);
        if (access.response || !access.context) return access.response;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const skip = Number(searchParams.get('skip') ?? 0);

        if (!Number.isInteger(skip) || skip < 0) {
            return NextResponse.json(
                { message: 'skip must be a non-negative integer.' },
                { status: 400 },
            );
        }

        const hiddenTargetIds = new Set<number>([access.context.session.userId]);

        if (access.context.isAdmin) {
            const admins = await prisma.admin.findMany({ select: { userId: true } });
            admins.forEach((admin) => hiddenTargetIds.add(admin.userId));
        } else {
            const [admins, moderators] = await Promise.all([
                prisma.admin.findMany({ select: { userId: true } }),
                prisma.moderator.findMany({ select: { userId: true } }),
            ]);

            admins.forEach((admin) => hiddenTargetIds.add(admin.userId));
            moderators.forEach((moderator) => hiddenTargetIds.add(moderator.userId));
        }

        const where = {
            status: (status === 'CLOSED' ? 'CLOSED' : 'OPEN') as 'OPEN' | 'CLOSED',
            targetUserId: { notIn: Array.from(hiddenTargetIds) },
        };

        const [reports, total] = await prisma.$transaction([
            prisma.report.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: REPORTS_TAKE,
                select: {
                id: true,
                reporterId: true,
                targetUserId: true,
                messageId: true,
                commentId: true,
                collectionId: true,
                reason: true,
                details: true,
                status: true,
                verdict: true,
                resolution: true,
                createdAt: true,
                reporter: {
                    select: { id: true, username: true, avatarUrl: true },
                },
                targetUser: {
                    select: { id: true, username: true, avatarUrl: true },
                },
                reviewedBy: {
                    select: { id: true, username: true, avatarUrl: true },
                },
                message: {
                    select: {
                        id: true,
                        content: true,
                        chatId: true,
                        createdAt: true,
                    },
                },
                comment: {
                    select: {
                        id: true,
                        text: true,
                        collectionId: true,
                        createdAt: true,
                        Collection: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                collection: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        private: true,
                        createdAt: true,
                    },
                },
                },
            }),
            prisma.report.count({ where }),
        ]);

        const nextSkip = skip + reports.length < total ? skip + reports.length : null;

        return NextResponse.json(
            {
                data: reports.map((report) => ({
                    ...report,
                    reviewedAt: null,
                })),
                total,
                nextSkip,
            },
            { status: 200 },
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
