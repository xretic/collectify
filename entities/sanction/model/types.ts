export type SanctionScope = 'ACCOUNT' | 'COMMENTS' | 'MESSENGER';

export const SANCTION_SCOPES: readonly SanctionScope[] = ['ACCOUNT', 'COMMENTS', 'MESSENGER'];

export type SanctionDuration = '1h' | '1d' | '7d' | '30d' | 'permanent';

export const SANCTION_DURATIONS: readonly SanctionDuration[] = [
    '1h',
    '1d',
    '7d',
    '30d',
    'permanent',
];

export const SANCTION_DURATION_MS: Record<SanctionDuration, number | null> = {
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    permanent: null,
};

export const SANCTION_SCOPE_LABELS: Record<SanctionScope, string> = {
    ACCOUNT: 'Account ban',
    COMMENTS: 'Comments mute',
    MESSENGER: 'Messenger mute',
};

export const SANCTION_DURATION_LABELS: Record<SanctionDuration, string> = {
    '1h': '1 hour',
    '1d': '1 day',
    '7d': '7 days',
    '30d': '30 days',
    permanent: 'Permanent',
};

export type ActiveSanction = {
    id: number;
    scope: SanctionScope;
    reason: string;
    expiresAt: string | null;
    createdAt: string;
};

/** `null` expiry = permanent = strongest. */
export function isStrongerOrEqual(a: Date | null, b: Date | null): boolean {
    if (a === null) return true;
    if (b === null) return false;
    return a.getTime() >= b.getTime();
}

export function expiresAtFromDuration(duration: SanctionDuration, now = Date.now()): Date | null {
    const ms = SANCTION_DURATION_MS[duration];
    return ms === null ? null : new Date(now + ms);
}
