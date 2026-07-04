import { getActiveSanctionsForUsers, requireManagementAccess } from '@/helpers/management';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRoles } from '@/helpers/getUserRoles';

const TAKE = 30;

export async function GET(req: NextRequest) {
    try {
        const { response, context } = await requireManagementAccess(req);
        if (response || !context) return response;

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query')?.trim() ?? '';
        const skip = Number(searchParams.get('skip') ?? 0);
        const userIdParam = searchParams.get('userId');
        const userId = userIdParam ? Number(userIdParam) : null;

        if (!Number.isInteger(skip) || skip < 0) {
            return NextResponse.json(
                { message: 'skip must be a non-negative integer.' },
                { status: 400 },
            );
        }

        if (userId !== null && (!Number.isInteger(userId) || userId <= 0)) {
            return NextResponse.json({ message: 'Invalid user id.' }, { status: 400 });
        }

        const searchWhere: Prisma.UserWhereInput = query
            ? {
                  OR: [
                      { username: { contains: query, mode: 'insensitive' as const } },
                      { fullName: { contains: query, mode: 'insensitive' as const } },
                      { email: { contains: query, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const hiddenIds = new Set<number>([context.session.userId]);

        if (context.isAdmin) {
            const admins = await prisma.admin.findMany({ select: { userId: true } });
            admins.forEach((admin) => hiddenIds.add(admin.userId));
        } else {
            const [admins, moderators] = await Promise.all([
                prisma.admin.findMany({ select: { userId: true } }),
                prisma.moderator.findMany({ select: { userId: true } }),
            ]);

            admins.forEach((admin) => hiddenIds.add(admin.userId));
            moderators.forEach((moderator) => hiddenIds.add(moderator.userId));
        }

        const where: Prisma.UserWhereInput = {
            AND: [userId ? { id: userId } : searchWhere, { id: { notIn: Array.from(hiddenIds) } }],
        };

        const [users, total] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: TAKE,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    fullName: true,
                    avatarUrl: true,
                    createdAt: true,
                    _count: {
                        select: {
                            collections: true,
                            Comment: true,
                            messages: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);

        const userIds = users.map((user) => user.id);
        const sanctions = await getActiveSanctionsForUsers(userIds);

        const data = await Promise.all(
            users.map(async (user) => ({
                ...user,
                roles: await getUserRoles(user.id),
                activeSanctions: sanctions
                    .filter((sanction) => sanction.userId === user.id)
                    .map((sanction) => ({
                        id: sanction.id,
                        scope: sanction.scope,
                        reason: sanction.reason,
                        expiresAt: sanction.expiresAt,
                        createdAt: sanction.createdAt,
                    })),
            })),
        );

        return NextResponse.json({ data, total }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}
