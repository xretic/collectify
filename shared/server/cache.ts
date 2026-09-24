import 'server-only';
import { redis } from './redis';

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

    const value = await fetcher();

    try {
        await redis.set(fullKey, JSON.stringify(value), ttlSeconds);
    } catch (error) {
        console.error('[cache] write failed:', error);
    }

    return value;
}

export async function bumpCacheNamespace(namespace: string): Promise<void> {
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
