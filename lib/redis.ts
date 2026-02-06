import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';

export type RedisKV = {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, opts?: { ex?: number }): Promise<void>;
    del(key: string): Promise<number>;

    getJson<T>(key: string): Promise<T | null>;
    setJson(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;
};

const isProd = process.env.NODE_ENV === 'production';

let redis: RedisKV;

if (isProd) {
    const upstash = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    redis = {
        async get(key: string) {
            return (await upstash.get<string>(key)) ?? null;
        },

        async set(key: string, value: string, opts?: { ex?: number }) {
            await upstash.set(key, value, opts?.ex ? { ex: opts.ex } : undefined);
        },

        async del(key: string) {
            const res = await upstash.del(key);
            return typeof res === 'number' ? res : 1;
        },

        async getJson<T>(key: string) {
            const raw = await this.get(key);
            return raw ? (JSON.parse(raw) as T) : null;
        },

        async setJson(key: string, value: unknown, opts?: { ex?: number }) {
            await this.set(key, JSON.stringify(value), opts);
        },
    };
} else {
    const client = new IORedis(process.env.REDIS_URL!);

    redis = {
        async get(key: string) {
            return await client.get(key);
        },

        async set(key: string, value: string, opts?: { ex?: number }) {
            opts?.ex ? await client.set(key, value, 'EX', opts.ex) : await client.set(key, value);
        },

        async del(key: string) {
            return await client.del(key);
        },

        async getJson<T>(key: string) {
            const raw = await client.get(key);
            return raw ? (JSON.parse(raw) as T) : null;
        },

        async setJson(key: string, value: unknown, opts?: { ex?: number }) {
            const raw = JSON.stringify(value);
            opts?.ex ? await client.set(key, raw, 'EX', opts.ex) : await client.set(key, raw);
        },
    };
}

export { redis };
