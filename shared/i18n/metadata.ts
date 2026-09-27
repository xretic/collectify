import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Messages } from './types';

type PageKey = keyof Messages['meta']['pages'];

/** `generateMetadata` for a static page: its title in the viewer's language. */
export function pageMetadata(key: PageKey, extra: Metadata = {}) {
    return async (): Promise<Metadata> => {
        const t = await getTranslations('meta.pages');
        return { ...extra, title: t(key) };
    };
}

/**
 * Open Graph / Twitter tags of a content page. A page's `openGraph` replaces
 * the layout's, so the shared fields are repeated here; the image comes from
 * the route's `opengraph-image`.
 */
export function socialMetadata({
    title,
    description,
    type = 'article',
}: {
    title: string;
    description: string;
    type?: 'article' | 'profile';
}): Pick<Metadata, 'openGraph' | 'twitter'> {
    return {
        openGraph: { siteName: 'Collectify', type, title, description },
        twitter: { card: 'summary_large_image', title, description },
    };
}
