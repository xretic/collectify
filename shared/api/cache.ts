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
    const cached = await redis.getJson<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await redis.setJson(key, value, { ex: ttlSeconds });
    return value;
}

export async function invalidateCache(key: string): Promise<void> {
    await redis.del(key);
}
