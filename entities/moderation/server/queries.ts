import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/shared/server/db';
import { getActiveSanctions } from '@/entities/sanction/server/sanctions';
import {
    nonAdminUserFilter,
    nonStaffUserFilter,
    roleSelect,
    toRoles,
} from '@/entities/user/server/roles';
import type {
    AuditPage,
    HistoryPage,
    ManagedCollection,
    ManagedComment,
    ManagementUsersPage,
} from '../model/types';

const USERS_PAGE_SIZE = 30;
const AUDIT_PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 10;

const preview = { select: { id: true, username: true, avatarUrl: true } } as const;

/** Users a staff member may manage: never themselves, never admins; moderators also not moderators. */
export function manageableUsersFilter(viewer: {
    userId: number;
    isAdmin: boolean;
}): Prisma.UserWhereInput {
    return {
        id: { not: viewer.userId },
        ...(viewer.isAdmin ? nonAdminUserFilter : nonStaffUserFilter),
    };
}

export async function listManagedUsers(
    viewer: { userId: number; isAdmin: boolean },
    { query, page, userId }: { query: string; page: number; userId?: number },
): Promise<ManagementUsersPage> {
    const search: Prisma.UserWhereInput = userId
        ? { id: userId }
        : query
          ? {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            }
          : {};

    const where = { AND: [search, manageableUsersFilter(viewer)] };

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: page * USERS_PAGE_SIZE,
            take: USERS_PAGE_SIZE,
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
                ...roleSelect,
                _count: {
                    select: {
                        collections: true,
                        comments: true,
                        messages: true,
                        reportsReceived: true,
                    },
                },
            },
        }),
        db.user.count({ where }),
    ]);

    const sanctions = await getActiveSanctions(users.map((user) => user.id));

    return {
        total,
        nextPage: (page + 1) * USERS_PAGE_SIZE < total ? page + 1 : null,
        data: users.map((user) => ({
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt.toISOString(),
            roles: toRoles(user),
            counts: {
                collections: user._count.collections,
                comments: user._count.comments,
                messages: user._count.messages,
                reportsReceived: user._count.reportsReceived,
            },
            activeSanctions: sanctions
                .filter((sanction) => sanction.userId === user.id)
                .map((sanction) => ({
                    id: sanction.id,
                    scope: sanction.scope,
                    reason: sanction.reason,
                    expiresAt: sanction.expiresAt?.toISOString() ?? null,
                    createdAt: sanction.createdAt.toISOString(),
                })),
        })),
    };
}

export async function listAudit(userId: number, cursor: number | null): Promise<AuditPage> {
    const rows = await db.moderationAction.findMany({
        where: {
            OR: [{ actorId: userId }, { targetUserId: userId }],
            ...(cursor ? { id: { lt: cursor } } : {}),
        },
        orderBy: { id: 'desc' },
        take: AUDIT_PAGE_SIZE + 1,
        select: {
            id: true,
            action: true,
            reason: true,
            createdAt: true,
            impersonatorId: true,
            actor: preview,
            targetUser: preview,
        },
    });

    const page = rows.slice(0, AUDIT_PAGE_SIZE);
    const impersonatorIds = [...new Set(page.flatMap((row) => row.impersonatorId ?? []))];
    const impersonators = impersonatorIds.length
        ? await db.user.findMany({
              where: { id: { in: impersonatorIds } },
              select: { id: true, username: true, avatarUrl: true },
          })
        : [];

    return {
        nextCursor: rows.length > AUDIT_PAGE_SIZE ? page[page.length - 1].id : null,
        data: page.map((row) => ({
            id: row.id,
            action: row.action,
            reason: row.reason,
            createdAt: row.createdAt.toISOString(),
            actor: row.actor,
            targetUser: row.targetUser,
            impersonator: impersonators.find((user) => user.id === row.impersonatorId) ?? null,
        })),
    };
}

const nextSkip = (skip: number, pageSize: number, total: number) =>
    skip + pageSize < total ? skip + pageSize : null;

export async function listUserCollections(
    userId: number,
    skip: number,
): Promise<HistoryPage<ManagedCollection>> {
    const where = { userId };

    const [rows, total] = await Promise.all([
        db.collection.findMany({
            where,
            orderBy: { id: 'desc' },
            skip,
            take: HISTORY_PAGE_SIZE,
            select: {
                id: true,
                name: true,
                category: { select: { name: true } },
                private: true,
                createdAt: true,
                _count: { select: { items: true, comments: true, likes: true } },
            },
        }),
        db.collection.count({ where }),
    ]);

    return {
        total,
        nextSkip: nextSkip(skip, HISTORY_PAGE_SIZE, total),
        data: rows.map((row) => ({
            id: row.id,
            name: row.name,
            category: row.category.name,
            isPrivate: row.private,
            createdAt: row.createdAt.toISOString(),
            counts: row._count,
        })),
    };
}

export async function listUserComments(
    userId: number,
    skip: number,
): Promise<HistoryPage<ManagedComment>> {
    const where = { userId };

    const [rows, total] = await Promise.all([
        db.comment.findMany({
            where,
            orderBy: { id: 'desc' },
            skip,
            take: HISTORY_PAGE_SIZE,
            select: {
                id: true,
                text: true,
                createdAt: true,
                collection: { select: { id: true, name: true } },
            },
        }),
        db.comment.count({ where }),
    ]);

    return {
        total,
        nextSkip: nextSkip(skip, HISTORY_PAGE_SIZE, total),
        data: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    };
}
