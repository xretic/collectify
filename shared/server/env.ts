import 'server-only';
import { z } from 'zod';

const optional = z.string().trim().min(1).optional().catch(undefined);

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    /** Public origin (e.g. https://colleo.xyz). Falls back to the request origin. */
    APP_URL: z.string().url().optional().catch(undefined),

    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    GITHUB_CLIENT_ID: optional,
    GITHUB_CLIENT_SECRET: optional,

    PUSHER_APP_ID: optional,
    PUSHER_SECRET: optional,
    NEXT_PUBLIC_PUSHER_KEY: optional,
    NEXT_PUBLIC_PUSHER_CLUSTER: optional,

    /** Resend key; without it (or with an unverified sender domain) sending answers 503. */
    RESEND_API_KEY: optional,
    /** Sender, e.g. `Collectify <noreply@colleo.xyz>` (the domain must be verified in Resend). */
    EMAIL_FROM: optional,

    /** Uploadcare REST key: deleting an account also deletes the images it uploaded. */
    UPLOADCARE_SECRET_KEY: optional,

    /** Operator shown on the legal pages (Legal notice, Terms, Privacy Policy). */
    LEGAL_NAME: optional,
    LEGAL_ADDRESS: optional,
    CONTACT_EMAIL: z.string().trim().email().optional().catch(undefined),
    /** Country whose law governs the Terms, e.g. "Czech Republic". */
    LEGAL_COUNTRY: optional,

    /** Search console ownership tokens (the `content` of their meta tags). */
    GOOGLE_SITE_VERIFICATION: optional,
    BING_SITE_VERIFICATION: optional,
    YANDEX_VERIFICATION: optional,

    REDIS_URL: optional,
    UPSTASH_REDIS_REST_URL: optional,
    UPSTASH_REDIS_REST_TOKEN: optional,
});

export type ServerEnv = z.infer<typeof schema>;

export const serverEnv: ServerEnv = schema.parse(process.env);

export const isProduction = serverEnv.NODE_ENV === 'production';

/**
 * Absolute base for metadata URLs (Open Graph images, canonical links):
 * `APP_URL`, else the Vercel deployment host, else the local dev server.
 */
export function siteUrl() {
    if (serverEnv.APP_URL) return new URL(serverEnv.APP_URL);
    const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
    return new URL(vercelHost ? `https://${vercelHost}` : 'http://localhost:3000');
}
