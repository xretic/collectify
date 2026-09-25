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
