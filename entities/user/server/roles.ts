import 'server-only';
import { db } from '@/shared/server/db';
import type { Prisma } from '@/generated/prisma/client';
import type { UserRole } from '../model/types';

const roleSelect = {
    admin: { select: { id: true } },
    moderator: { select: { id: true } },
    verified: { select: { id: true } },
} satisfies Prisma.UserSelect;

type RoleRows = Prisma.UserGetPayload<{ select: typeof roleSelect }>;

export function toRoles(row: RoleRows): UserRole[] {
    const roles: UserRole[] = [];
    if (row.admin) roles.push('Admin');
    if (row.moderator) roles.push('Moderator');
    if (row.verified) roles.push('Verified');
    return roles;
}

export { roleSelect };

export async function getUserRoles(userId: number): Promise<UserRole[]> {
    const row = await db.user.findUnique({ where: { id: userId }, select: roleSelect });
    return row ? toRoles(row) : [];
}

export async function getUserRolesMap(userIds: number[]): Promise<Map<number, UserRole[]>> {
    if (userIds.length === 0) return new Map();

    const rows = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, ...roleSelect },
    });

    return new Map(rows.map((row) => [row.id, toRoles(row)]));
}

/** Prisma filter: users without staff roles (moderators may only see these). */
export const nonStaffUserFilter = {
    admin: { is: null },
    moderator: { is: null },
} satisfies Prisma.UserWhereInput;

export const nonAdminUserFilter = { admin: { is: null } } satisfies Prisma.UserWhereInput;
