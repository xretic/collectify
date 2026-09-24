import 'server-only';
import { db } from '@/shared/server/db';
import { forbidden, notFound } from '@/shared/server/http';
import { bumpCacheNamespace } from '@/shared/server/cache';
import { assertCanModerate, type StaffContext } from '@/features/auth/server/guards';
import { getActiveSanction, issueSanction } from '@/entities/sanction/server/sanctions';
import {
    expiresAtFromDuration,
    type SanctionDuration,
    type SanctionScope,
} from '@/entities/sanction/model/types';
import { writeAudit } from '@/entities/moderation/server/audit';
import { notifySystem } from '@/entities/notification/server/notifications';
import { getUserRoles } from '@/entities/user/server/roles';
import { COLLECTIONS_CACHE_NAMESPACE } from '@/entities/collection/server/queries';

async function assertUserExists(userId: number) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw notFound('User not found.');
}

export async function issueManualSanction(
    ctx: StaffContext,
    targetUserId: number,
    input: { scope: SanctionScope; duration: SanctionDuration; reason: string },
) {
    await assertUserExists(targetUserId);
    await assertCanModerate(ctx, targetUserId);

    const expiresAt = expiresAtFromDuration(input.duration);
    if (expiresAt === null && !ctx.isAdmin)
        throw forbidden('Only admins can issue permanent sanctions.');

    return db.$transaction(async (tx) => {
        const result = await issueSanction(tx, {
            userId: targetUserId,
            moderatorId: ctx.userId,
            scope: input.scope,
            expiresAt,
            reason: input.reason,
        });

        await writeAudit(
            ctx.actor,
            {
                action: `sanction:${input.scope}`,
                reason: input.reason,
                targetUserId,
                metadata: {
                    duration: input.duration,
                    expiresAt: expiresAt?.toISOString() ?? null,
                    sanctionId: result.sanctionId,
                    applied: result.applied,
                },
            },
            tx,
        );

        if (result.applied) await notifySystem(targetUserId, 'SANCTION', tx);

        return result;
    });
}

/**
 * Moderators may lift only temporary sanctions issued by non-admins; admins
 * may lift anything.
 */
export async function revokeSanction(ctx: StaffContext, sanctionId: number) {
    const sanction = await db.accountSanction.findUnique({
        where: { id: sanctionId },
        select: {
            id: true,
            userId: true,
            scope: true,
            expiresAt: true,
            revokedAt: true,
            moderatorId: true,
        },
    });

    if (!sanction || sanction.revokedAt) throw notFound('Sanction not found.');

    await assertCanModerate(ctx, sanction.userId);

    if (!ctx.isAdmin) {
        if (sanction.expiresAt === null)
            throw forbidden('Only admins can lift permanent sanctions.');

        const issuerRoles = sanction.moderatorId ? await getUserRoles(sanction.moderatorId) : [];
        if (issuerRoles.includes('Admin'))
            throw forbidden('Only admins can lift sanctions issued by an admin.');
    }

    await db.$transaction(async (tx) => {
        await tx.accountSanction.update({
            where: { id: sanction.id },
            data: { revokedAt: new Date() },
        });

        await writeAudit(
            ctx.actor,
            {
                action: `revoke-sanction:${sanction.scope}`,
                targetUserId: sanction.userId,
                metadata: { sanctionId: sanction.id },
            },
            tx,
        );
    });
}

export async function setUserRole(
    ctx: StaffContext,
    targetUserId: number,
    input: { role: 'Moderator' | 'Verified'; enabled: boolean; reason: string },
) {
    if (input.role === 'Moderator' && !ctx.isAdmin)
        throw forbidden('Only admins can manage moderators.');

    await assertUserExists(targetUserId);
    await assertCanModerate(ctx, targetUserId);

    await db.$transaction(async (tx) => {
        if (input.role === 'Moderator') {
            if (input.enabled) {
                await tx.moderator.upsert({
                    where: { userId: targetUserId },
                    update: { assignedBy: ctx.userId },
                    create: { userId: targetUserId, assignedBy: ctx.userId },
                });
            } else {
                await tx.moderator.deleteMany({ where: { userId: targetUserId } });
            }
        } else if (input.enabled) {
            await tx.verified.upsert({
                where: { userId: targetUserId },
                update: {},
                create: { userId: targetUserId },
            });
        } else {
            await tx.verified.deleteMany({ where: { userId: targetUserId } });
        }

        await writeAudit(
            ctx.actor,
            {
                action: `${input.enabled ? 'grant' : 'revoke'}:${input.role}`,
                reason: input.reason,
                targetUserId,
            },
            tx,
        );
    });
}

/**
 * Deletes an account. Direct chats of the user go too (a chat with one side
 * missing is useless); the audit record keeps only non-personal data.
 */
export async function deleteUserAccount(ctx: StaffContext, targetUserId: number) {
    const target = await db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true },
    });
    if (!target) throw notFound('User not found.');

    await assertCanModerate(ctx, targetUserId);

    await db.$transaction(async (tx) => {
        await writeAudit(
            ctx.actor,
            {
                action: 'delete-user',
                metadata: { deletedUserId: target.id, username: target.username },
            },
            tx,
        );

        await tx.chat.deleteMany({ where: { users: { some: { id: targetUserId } } } });
        await tx.user.delete({ where: { id: targetUserId } });
    });

    await bumpCacheNamespace(COLLECTIONS_CACHE_NAMESPACE);
}

export async function startImpersonation(ctx: StaffContext, targetUserId: number) {
    if (targetUserId === ctx.userId) throw forbidden('You are already signed in as this user.');
    if (ctx.session.impersonatorUserId) throw forbidden('Stop the current impersonation first.');

    const target = await db.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true },
    });
    if (!target) throw notFound('User not found.');

    await assertCanModerate(ctx, targetUserId);

    if (await getActiveSanction(targetUserId, 'ACCOUNT')) {
        throw forbidden('You cannot impersonate a banned account.');
    }

    await db.$transaction(async (tx) => {
        await tx.session.update({
            where: { id: ctx.session.id },
            data: { userId: targetUserId, impersonatorUserId: ctx.userId },
        });

        await writeAudit(
            ctx.actor,
            { action: 'impersonate-user', targetUserId, metadata: { username: target.username } },
            tx,
        );
    });
}
