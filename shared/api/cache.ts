import { redis } from '@/shared/lib/redis';

/**
 * Cache-aside helper: serves `key` from Redis if present, otherwise runs
 * `fetcher`, stores the result for `ttlSeconds`, and returns it. Only use
 * for responses that don't vary per requesting user — anything gated by
 * session/ownership must not be cached this way.
 */
export async function withCache<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
): Promise<T> {
    try {
        const cached = await redis.getJson<T>(key);
        if (cached !== null) return cached;
    } catch (e) {
        console.error('[cache] read failed, serving fresh:', e);
        return fetcher();
    }

    const value = await fetcher();

    try {
        await redis.setJson(key, value, { ex: ttlSeconds });
    } catch (e) {
        console.error('[cache] write failed:', e);
    }

    return value;
}

export async function invalidateCache(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (e) {
        console.error('[cache] invalidate failed:', e);
    }
}
