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
