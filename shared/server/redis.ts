import 'server-only';
import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';
import { serverEnv } from './env';

/** Minimal key-value surface shared by Upstash, ioredis and the no-op fallback. */
export type KeyValueStore = {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    incr(key: string, ttlSeconds?: number): Promise<number>;
};

function createUpstashStore(url: string, token: string): KeyValueStore {
    const client = new UpstashRedis({ url, token, automaticDeserialization: false });

    return {
        async get(key) {
            return (await client.get<string>(key)) ?? null;
        },
        async set(key, value, ttlSeconds) {
            await client.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined);
        },
        async incr(key, ttlSeconds) {
            const value = await client.incr(key);
            if (ttlSeconds && value === 1) await client.expire(key, ttlSeconds);
            return value;
        },
    };
}

function createIORedisStore(url: string): KeyValueStore {
    const client = new IORedis(url, {
        lazyConnect: true,
        connectTimeout: 2_000,
        maxRetriesPerRequest: 1,
        // Give up after a few attempts so a missing local Redis fails fast
        // (callers fall back to fresh data / in-memory counters).
        retryStrategy: (attempt) => (attempt > 3 ? null : attempt * 200),
    });

    client.on('error', (error) => console.error('[redis]', error.message));

    return {
        async get(key) {
            return client.get(key);
        },
        async set(key, value, ttlSeconds) {
            if (ttlSeconds) await client.set(key, value, 'EX', ttlSeconds);
            else await client.set(key, value);
        },
        async incr(key, ttlSeconds) {
            const value = await client.incr(key);
            if (ttlSeconds && value === 1) await client.expire(key, ttlSeconds);
            return value;
        },
    };
}

function createStore(): KeyValueStore | null {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, REDIS_URL } = serverEnv;

    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
        return createUpstashStore(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN);
    }

    if (REDIS_URL) return createIORedisStore(REDIS_URL);

    return null;
}

/** `null` when no Redis is configured. */
export const redis = createStore();
