import 'server-only';
import { db, type Tx } from '@/shared/server/db';
import { forbidden, type ErrorKey } from '@/shared/server/http';
import { isStrongerOrEqual, type SanctionScope } from '../model/types';

const activeWhere = (now: Date) => ({
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
});

export async function getActiveSanctions(
    userIds: number[],
    scope?: SanctionScope,
    client: Tx = db,
) {
    if (userIds.length === 0) return [];

    return client.accountSanction.findMany({
        where: { userId: { in: userIds }, ...(scope ? { scope } : {}), ...activeWhere(new Date()) },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            userId: true,
            moderatorId: true,
            scope: true,
            reason: true,
            expiresAt: true,
            createdAt: true,
        },
    });
}

export async function getActiveSanction(userId: number, scope: SanctionScope, client: Tx = db) {
    const [sanction] = await getActiveSanctions([userId], scope, client);
    return sanction ?? null;
}

const SANCTION_ERRORS = {
    ACCOUNT: ['bannedUntil', 'bannedPermanent'],
    COMMENTS: ['mutedCommentsUntil', 'mutedCommentsPermanent'],
    MESSENGER: ['mutedMessengerUntil', 'mutedMessengerPermanent'],
} as const satisfies Record<SanctionScope, readonly [ErrorKey, ErrorKey]>;

/** 403 explaining the restriction and when it ends ("2026-10-01 14:30 UTC"). */
export function sanctionError(scope: SanctionScope, expiresAt: Date | null) {
    const [until, permanent] = SANCTION_ERRORS[scope];
    if (!expiresAt) return forbidden(permanent);

    return forbidden(until, {
        date: `${expiresAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    });
}

/** Throws 403 when the user is muted in the given scope. */
export async function assertNotMuted(userId: number, scope: Exclude<SanctionScope, 'ACCOUNT'>) {
    const sanction = await getActiveSanction(userId, scope);
    if (!sanction) return;

    throw sanctionError(scope, sanction.expiresAt);
}

type IssueSanctionInput = {
    userId: number;
    moderatorId: number;
    scope: SanctionScope;
    expiresAt: Date | null;
    reason: string;
};

/**
 * Applies a sanction without ever weakening an existing one: if an active
 * sanction of the same scope already lasts at least as long, it is kept and
 * returned (`applied: false`). Otherwise the weaker one is revoked and the new
 * one created. Must run inside a transaction.
 */
export async function issueSanction(tx: Tx, input: IssueSanctionInput) {
    const now = new Date();
    const current = await getActiveSanction(input.userId, input.scope, tx);

    if (current && isStrongerOrEqual(current.expiresAt, input.expiresAt)) {
        return { sanctionId: current.id, applied: false };
    }

    if (current) {
        await tx.accountSanction.update({ where: { id: current.id }, data: { revokedAt: now } });
    }

    const created = await tx.accountSanction.create({
        data: {
            userId: input.userId,
            moderatorId: input.moderatorId,
            scope: input.scope,
            reason: input.reason,
            expiresAt: input.expiresAt,
        },
        select: { id: true },
    });

    if (input.scope === 'ACCOUNT') {
        await tx.session.deleteMany({ where: { userId: input.userId } });
    }

    return { sanctionId: created.id, applied: true };
}
