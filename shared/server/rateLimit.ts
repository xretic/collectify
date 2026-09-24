import 'server-only';
import { NextRequest } from 'next/server';
import { ApiError } from './http';
import { redis } from './redis';

export type RateLimitPreset =
    | 'auth'
    | 'search'
    | 'mutation'
    | 'report'
    | 'message'
    | 'comment'
    | 'create';

const PRESETS: Record<RateLimitPreset, { limit: number; windowSeconds: number }> = {
    auth: { limit: 8, windowSeconds: 60 },
    search: { limit: 60, windowSeconds: 60 },
    mutation: { limit: 60, windowSeconds: 60 },
    report: { limit: 5, windowSeconds: 60 },
    message: { limit: 30, windowSeconds: 60 },
    comment: { limit: 10, windowSeconds: 60 },
    create: { limit: 10, windowSeconds: 60 },
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryIncr(key: string, windowSeconds: number) {
    const now = Date.now();
    const bucket = memoryBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
        return 1;
    }

    bucket.count += 1;
    return bucket.count;
}

export function getClientIp(req: NextRequest): string {
    return (
        req.headers.get('x-real-ip') ??
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        'unknown'
    );
}

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
    const { limit, windowSeconds } = PRESETS[preset];
    const subject = userId ? `u:${userId}` : `ip:${getClientIp(req)}`;
    const window = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `ratelimit:${preset}:${subject}:${window}`;

    let count: number;

    try {
        count = redis ? await redis.incr(key, windowSeconds) : memoryIncr(key, windowSeconds);
    } catch (error) {
        console.error('[rateLimit] backend failed, using memory counter:', error);
        count = memoryIncr(key, windowSeconds);
    }

    if (count > limit) {
        throw new ApiError(429, 'Too many requests. Please try again later.', {
            'Retry-After': String(windowSeconds),
        });
    }
}
