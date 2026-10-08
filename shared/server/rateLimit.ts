import 'server-only';
import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { ApiError, apiError } from './http';
import { getRedis } from './redis';

export type RateLimitPreset =
    | 'auth'
    | 'login'
    | 'loginAccount'
    | 'notice'
    | 'read'
    | 'search'
    | 'feed'
    | 'autocomplete'
    | 'mutation'
    | 'report'
    | 'message'
    | 'realtime'
    | 'comment'
    | 'create'
    | 'email'
    | 'export';

const PRESETS: Record<RateLimitPreset, { limit: number; windowSeconds: number }> = {
    auth: { limit: 8, windowSeconds: 60 },
    /** Failed sign-ins into one account from one IP. */
    login: { limit: 10, windowSeconds: 15 * 60 },
    /**
     * Failed sign-ins into one account from anywhere: high enough that locking
     * the owner out takes many IPs, low enough to stop spread-out guessing.
     */
    loginAccount: { limit: 200, windowSeconds: 60 * 60 },
    /** "You already have an account" mails to one address. */
    notice: { limit: 1, windowSeconds: 24 * 60 * 60 },
    /** Public reads of a single resource (a collection, a profile, its comments). */
    read: { limit: 120, windowSeconds: 60 },
    search: { limit: 60, windowSeconds: 60 },
    /**
     * Feed pages (home feed, recommendations) while scrolling. Its own bucket,
     * so scrolling does not use up the budget of search and other reads.
     */
    feed: { limit: 240, windowSeconds: 60 },
    autocomplete: { limit: 180, windowSeconds: 60 },
    mutation: { limit: 60, windowSeconds: 60 },
    report: { limit: 5, windowSeconds: 60 },
    message: { limit: 30, windowSeconds: 60 },
    /** Typing pings (at most one a second per chat while typing). */
    realtime: { limit: 120, windowSeconds: 60 },
    comment: { limit: 10, windowSeconds: 60 },
    create: { limit: 10, windowSeconds: 60 },
    /** Emails to one address (reset / confirmation links). */
    email: { limit: 3, windowSeconds: 60 * 60 },
    /** Full data exports (heavy queries). */
    export: { limit: 5, windowSeconds: 60 * 60 },
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

/** Expired buckets are dropped at most this often, so the map cannot grow without bound. */
const SWEEP_INTERVAL_MS = 60_000;
let nextSweepAt = 0;

function sweepExpired(now: number) {
    if (now < nextSweepAt) return;
    nextSweepAt = now + SWEEP_INTERVAL_MS;

    for (const [key, bucket] of memoryBuckets) {
        if (bucket.resetAt <= now) memoryBuckets.delete(key);
    }
}

function memoryIncr(key: string, windowSeconds: number) {
    const now = Date.now();
    sweepExpired(now);
    const bucket = memoryBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
        return 1;
    }

    bucket.count += 1;
    return bucket.count;
}

/**
 * Set by the platform (Vercel) or by server.mjs, which replaces any value the
 * client sent. Without X-Real-IP, the last X-Forwarded-For hop is the one the
 * nearest proxy added; earlier entries are client-controlled.
 */
export function getClientIp(req: NextRequest): string {
    return (
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ||
        'unknown'
    );
}

const subjectKey = (subject: string) =>
    createHash('sha256').update(subject).digest('base64url').slice(0, 22);

/**
 * Fixed-window rate limit. Authenticated calls are keyed by user id (IP
 * rotation does not help), anonymous ones by IP. Uses Redis when configured
 * and an in-process counter otherwise, so limits always apply.
 */
export async function enforceRateLimit(
    req: NextRequest,
    preset: RateLimitPreset,
    userId?: number,
): Promise<void> {
    await enforceRateLimitFor(userId ? `u:${userId}` : `ip:${getClientIp(req)}`, preset);
}

/**
 * Same limit keyed by an arbitrary subject (e.g. the recipient of an email).
 * Returns `release`, which gives the attempt back (for work that failed on our
 * side, so it does not count against the user).
 */
export async function enforceRateLimitFor(
    subject: string,
    preset: RateLimitPreset,
): Promise<() => Promise<void>> {
    const { limit, windowSeconds } = PRESETS[preset];
    const window = Math.floor(Date.now() / (windowSeconds * 1000));
    // Subjects are emails and IPs: only a hash of them is kept in the store.
    const key = `ratelimit:${preset}:${subjectKey(subject)}:${window}`;

    const redis = getRedis();
    let count: number;
    let counted: 'redis' | 'memory' = redis ? 'redis' : 'memory';

    try {
        count = redis ? await redis.incr(key, windowSeconds) : memoryIncr(key, windowSeconds);
    } catch (error) {
        console.error('[rateLimit] backend failed, using memory counter:', error);
        count = memoryIncr(key, windowSeconds);
        counted = 'memory';
    }

    if (count > limit) {
        throw apiError(429, 'tooManyRequests', undefined, {
            'Retry-After': String(windowSeconds),
        });
    }

    return async () => {
        try {
            if (counted === 'redis') await redis?.decr(key);
            else {
                const bucket = memoryBuckets.get(key);
                if (bucket && bucket.count > 0) bucket.count -= 1;
            }
        } catch (error) {
            console.error('[rateLimit] release failed:', error);
        }
    };
}

/**
 * Like `enforceRateLimitFor`, but over the limit it answers `null` instead of
 * throwing: for work that is simply skipped then (e.g. an email not sent now).
 */
export async function tryRateLimitFor(
    subject: string,
    preset: RateLimitPreset,
): Promise<(() => Promise<void>) | null> {
    try {
        return await enforceRateLimitFor(subject, preset);
    } catch (error) {
        if (error instanceof ApiError && error.status === 429) return null;
        throw error;
    }
}
