import type { MetadataRoute } from 'next';
import { siteUrl } from '@/shared/server/env';

/** Public content is crawlable; personal and account pages are not. */
export default function robots(): MetadataRoute.Robots {
    const base = siteUrl();

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/auth/',
                '/chats',
                '/collections/create',
                '/collections/my',
                '/management',
                '/notifications',
                '/onboarding',
                '/settings',
                '/users/me',
            ],
        },
        sitemap: new URL('/sitemap.xml', base).toString(),
        host: base.origin,
    };
}
