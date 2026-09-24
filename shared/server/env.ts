import 'server-only';
import { z } from 'zod';

const optional = z.string().trim().min(1).optional().catch(undefined);

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    /** Public origin (e.g. https://collectify.app). Falls back to the request origin. */
    APP_URL: z.string().url().optional().catch(undefined),

    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    GITHUB_CLIENT_ID: optional,
    GITHUB_CLIENT_SECRET: optional,

    PUSHER_APP_ID: optional,
    PUSHER_SECRET: optional,
    NEXT_PUBLIC_PUSHER_KEY: optional,
    NEXT_PUBLIC_PUSHER_CLUSTER: optional,

    REDIS_URL: optional,
    UPSTASH_REDIS_REST_URL: optional,
    UPSTASH_REDIS_REST_TOKEN: optional,
});

export type ServerEnv = z.infer<typeof schema>;

export const serverEnv: ServerEnv = schema.parse(process.env);

export const isProduction = serverEnv.NODE_ENV === 'production';
