import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./shared/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Enforced CSP (the single source — no duplicate in vercel.json).
 * - 'unsafe-inline' scripts: Next.js bootstrap + the theme init script.
 * - 'unsafe-eval' only in development (React Refresh).
 * - Images are uploaded straight to upload.uploadcare.com (covered by connect-src https:).
 */
const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:" + (isDev ? ' ws:' : ''),
    "frame-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ');

const securityHeaders = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
];

const nextConfig: NextConfig = {
    // Reads its bundled cities.pbf from disk, so it must stay a plain Node require.
    serverExternalPackages: ['all-the-cities'],
    // User images are rendered with plain <img>, so the image optimizer only
    // serves local assets and cannot be abused as an open proxy.
    images: { remotePatterns: [] },
    async headers() {
        return [{ source: '/(.*)', headers: securityHeaders }];
    },
};

export default withNextIntl(nextConfig);
