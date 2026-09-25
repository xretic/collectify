import 'server-only';
import { getRedis } from './redis';

/** Cache fills in progress in this process, by full key. */
const inflight = new Map<string, Promise<unknown>>();

/**
 * Cache-aside for responses that do not depend on the viewer. Keys live under
 * a versioned namespace so a whole namespace can be invalidated at once with
 * `bumpCacheNamespace` (cheaper and safer than deleting keys by pattern).
 */
export async function withCache<T>(
    namespace: string,
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
): Promise<T> {
    const redis = getRedis();
    if (!redis) return fetcher();

    let fullKey: string;

    try {
        const version = (await redis.get(versionKey(namespace))) ?? '0';
        fullKey = `${namespace}:v${version}:${key}`;

        const cached = await redis.get(fullKey);
        if (cached !== null) return JSON.parse(cached) as T;
    } catch (error) {
        console.error('[cache] read failed, serving fresh:', error);
        return fetcher();
    }

    // Concurrent misses of one key in this process share a single fetch, so an
    // expiring hot key does not send every waiting request to the database.
    const pending = inflight.get(fullKey);
    if (pending) return pending as Promise<T>;

    const cacheKey = fullKey;
    const fill = (async () => {
        const value = await fetcher();

        try {
            await redis.set(cacheKey, JSON.stringify(value), ttlSeconds);
        } catch (error) {
            console.error('[cache] write failed:', error);
        }

        return value;
    })().finally(() => inflight.delete(cacheKey));

    inflight.set(cacheKey, fill);
    return fill;
}

export async function bumpCacheNamespace(namespace: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
        await redis.incr(versionKey(namespace));
    } catch (error) {
        console.error('[cache] invalidation failed:', error);
    }
}

function versionKey(namespace: string) {
    return `${namespace}:version`;
}
