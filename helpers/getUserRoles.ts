import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/UserRole';

export async function getUserRoles(id: number): Promise<UserRole[]> {
    const [admin, moderator, verified] = await prisma.$transaction([
        prisma.admin.findUnique({
            where: {
                userId: id,
            },
        }),
        prisma.moderator.findUnique({
            where: {
                userId: id,
            },
        }),
        prisma.verified.findUnique({
            where: {
                userId: id,
            },
        }),
    ]);

    const roles: UserRole[] = [];

    if (admin) roles.push('Admin');
    if (moderator) roles.push('Moderator');
    if (verified) roles.push('Verified');

    return roles;
}

/**
 * Batch role resolution for a list of users. Runs 3 queries total instead of
 * 3 per user, avoiding N+1 when rendering paginated user lists.
 */
export async function getUserRolesMap(ids: number[]): Promise<Map<number, UserRole[]>> {
    const map = new Map<number, UserRole[]>();
    if (ids.length === 0) return map;

    ids.forEach((id) => map.set(id, []));

    const [admins, moderators, verified] = await prisma.$transaction([
        prisma.admin.findMany({ where: { userId: { in: ids } }, select: { userId: true } }),
        prisma.moderator.findMany({ where: { userId: { in: ids } }, select: { userId: true } }),
        prisma.verified.findMany({ where: { userId: { in: ids } }, select: { userId: true } }),
    ]);

    admins.forEach(({ userId }) => map.get(userId)?.push('Admin'));
    moderators.forEach(({ userId }) => map.get(userId)?.push('Moderator'));
    verified.forEach(({ userId }) => map.get(userId)?.push('Verified'));

    return map;
}
