import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redisClient = hasUpstash
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

export type RateLimitPreset = 'auth' | 'search' | 'mutation' | 'report';

/**
 * Presets tuned per endpoint class. Auth is tightest (brute-force target),
 * search/mutation looser since they're used constantly during normal browsing.
 */
const PRESETS: Record<RateLimitPreset, { limit: number; window: `${number} ${'s' | 'm' | 'h'}` }> = {
    auth: { limit: 8, window: '1 m' },
    search: { limit: 60, window: '1 m' },
    mutation: { limit: 30, window: '1 m' },
    report: { limit: 5, window: '1 m' },
};

const limiters = new Map<RateLimitPreset, Ratelimit>();

function getLimiter(preset: RateLimitPreset): Ratelimit | null {
    if (!redisClient) return null;

    const cached = limiters.get(preset);
    if (cached) return cached;

    const { limit, window } = PRESETS[preset];
    const limiter = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `ratelimit:${preset}`,
        analytics: false,
    });

    limiters.set(preset, limiter);
    return limiter;
}

function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Applies a sliding-window rate limit keyed by IP (+ optional extra key, e.g.
 * a userId, to also cap authenticated abuse independent of shared IPs/NAT).
 * Fails open (no block) when Upstash isn't configured, so local dev / non-
 * Vercel deployments without Redis still work.
 */
export async function rateLimit(
    req: NextRequest,
    preset: RateLimitPreset,
    extraKey?: string,
): Promise<NextResponse | null> {
    const limiter = getLimiter(preset);
    if (!limiter) return null;

    const identifier = extraKey ? `${getClientIp(req)}:${extraKey}` : getClientIp(req);
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (success) return null;

    const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));

    return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSeconds),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
            },
        },
    );
}
