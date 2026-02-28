import type { NextConfig } from 'next';

const railwayUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? '';
const normalizedRailway = railwayUrl.replace(/\/+$/, '');

const securityHeaders = [
    {
        key: 'Content-Security-Policy-Report-Only',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' https:",
            `connect-src 'self' https: wss: ${normalizedRailway} ${normalizedRailway.replace('https://', 'wss://')}`,
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
];

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [{ protocol: 'https', hostname: '**' }],
    },
    async headers() {
        return [{ source: '/(.*)', headers: securityHeaders }];
    },
};

export default nextConfig;
