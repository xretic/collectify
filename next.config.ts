import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Enforced CSP (the single source — no duplicate in vercel.json).
 * - 'unsafe-inline' scripts: Next.js bootstrap + the theme init script.
 * - 'unsafe-eval' only in development (React Refresh).
 * - Uploadcare widget is loaded on demand from ucarecdn.com.
 */
const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://ucarecdn.com`,
    "style-src 'self' 'unsafe-inline' https://ucarecdn.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:" + (isDev ? ' ws:' : ''),
    "frame-src 'self' https://*.uploadcare.com",
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
    // User images are rendered with plain <img>, so the image optimizer only
    // serves local assets and cannot be abused as an open proxy.
    images: { remotePatterns: [] },
    async headers() {
        return [{ source: '/(.*)', headers: securityHeaders }];
    },
};

export default nextConfig;
