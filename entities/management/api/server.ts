import { getUserRoles } from '@/entities/user/api/getUserRoles';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { UserRole } from '@/types/UserRole';
import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSession } from '@/entities/auth/api/session';

export type SanctionScope = 'ACCOUNT' | 'COMMENTS' | 'MESSENGER';

type ActiveSanctionRow = {
    id: number;
    userId: number;
    scope: string;
    reason: string;
    expiresAt: string | null;
    createdAt: string;
};

export type ManagementContext = {
    session: NonNullable<Awaited<ReturnType<typeof requireActiveSession>>['session']>;
    roles: UserRole[];
    isAdmin: boolean;
    isModerator: boolean;
};

export async function getActiveSanction(userId: number, scope: SanctionScope) {
    const sanctions = await getActiveSanctionsForUsers([userId], scope);
    return sanctions[0] ?? null;
}

export async function getActiveSanctionsForUsers(userIds: number[], scope?: SanctionScope) {
    if (userIds.length === 0) return [];

    const rows = await prisma.$queryRaw<ActiveSanctionRow[]>`
        SELECT
            "id",
            "userId",
            "scope"::text AS "scope",
            "reason",
            "expiresAt"::text AS "expiresAt",
            "createdAt"::text AS "createdAt"
        FROM "AccountSanction"
        WHERE "userId" IN (${Prisma.join(userIds)})
            AND "revokedAt" IS NULL
            AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
            ${scope ? Prisma.sql`AND "scope"::text = ${scope}` : Prisma.empty}
        ORDER BY "createdAt" DESC
    `;

    return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        scope: row.scope as SanctionScope,
        reason: row.reason,
        expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
        createdAt: new Date(row.createdAt),
    }));
}

export async function getSanctionById(sanctionId: number) {
    const rows = await prisma.$queryRaw<ActiveSanctionRow[]>`
        SELECT
            "id",
            "userId",
            "scope"::text AS "scope",
            "reason",
            "expiresAt"::text AS "expiresAt",
            "createdAt"::text AS "createdAt"
        FROM "AccountSanction"
        WHERE "id" = ${sanctionId}
        LIMIT 1
    `;

    const row = rows[0];
    if (!row) return null;

    return {
        id: row.id,
        userId: row.userId,
        scope: row.scope as SanctionScope,
        reason: row.reason,
        expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
        createdAt: new Date(row.createdAt),
    };
}

export async function requireManagementAccess(req: NextRequest, adminOnly = false) {
    const sessionResult = await requireActiveSession(req);

    if (sessionResult.response || !sessionResult.session) {
        return { response: sessionResult.response, context: null };
    }

    const roles = await getUserRoles(sessionResult.session.userId);
    const isAdmin = roles.includes('Admin');
    const isModerator = roles.includes('Moderator');

    if (adminOnly ? !isAdmin : !isAdmin && !isModerator) {
        return {
            response: NextResponse.json({ message: 'Forbidden.' }, { status: 403 }),
            context: null,
        };
    }

    return {
        response: null,
        context: {
            session: sessionResult.session,
            roles,
            isAdmin,
            isModerator,
        },
    };
}

export async function getScopedSanctionResponse(userId: number, scope: SanctionScope) {
    const sanction = await getActiveSanction(userId, scope);
    if (!sanction) return null;

    const label = scope === 'COMMENTS' ? 'commenting' : 'messenger';

    return NextResponse.json(
        { message: sanctionMessage(`You are muted from using ${label}.`, sanction.expiresAt) },
        { status: 403 },
    );
}

export async function canModerateTarget(context: ManagementContext, targetUserId: number) {
    if (context.session.userId === targetUserId) {
        return { ok: false, message: 'You cannot moderate yourself.' };
    }

    const targetRoles = await getUserRoles(targetUserId);

    if (context.isAdmin) {
        if (targetRoles.includes('Admin')) {
            return { ok: false, message: 'Admins cannot manage other admins.' };
        }

        return { ok: true, message: '' };
    }

    if (context.isModerator && targetRoles.includes('Moderator')) {
        return { ok: false, message: 'Moderators cannot manage other moderators.' };
    }

    if (targetRoles.includes('Admin') || targetRoles.includes('Moderator')) {
        return { ok: false, message: 'Moderators cannot manage admins or moderators.' };
    }

    return { ok: true, message: '' };
}

export async function writeModerationAction(data: {
    actorId: number;
    targetUserId?: number | null;
    targetCollectionId?: number | null;
    targetCommentId?: number | null;
    action: string;
    reason?: string;
    metadata?: Prisma.InputJsonValue;
}) {
    await prisma.moderationAction.create({
        data: {
            actorId: data.actorId,
            targetUserId: data.targetUserId ?? null,
            targetCollectionId: data.targetCollectionId ?? null,
            targetCommentId: data.targetCommentId ?? null,
            action: data.action,
            reason: data.reason ?? '',
            metadata: data.metadata,
        },
    });
}

function sanctionMessage(prefix: string, expiresAt: Date | null) {
    if (!expiresAt) return `${prefix} This restriction is permanent.`;

    return `${prefix} It expires at ${expiresAt.toISOString()}.`;
}
