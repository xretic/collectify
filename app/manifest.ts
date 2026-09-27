import type { MetadataRoute } from 'next';

/** Lets phones install Collectify to the home screen. */
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Collectify - Collections of anything',
        short_name: 'Collectify',
        description:
            'Discover, save and share collections of books, games, movies, places and gear, curated by people with great taste.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3f4f6',
        theme_color: '#208fff',
        categories: ['social', 'lifestyle', 'entertainment'],
        icons: [
            { src: '/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/maskable-icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
    };
}
