import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/shared/config/i18n';
import type { Messages } from './types';

export const SITE_NAME = 'Collectify';

type PageKey = keyof Messages['meta']['pages'];

/** Personal, transactional and search pages: not in search results, links still followed. */
export const NO_INDEX = { index: false, follow: true } as const;

const OG_LOCALES: Record<Locale, string> = {
    en: 'en_US',
    cs: 'cs_CZ',
    pl: 'pl_PL',
    uk: 'uk_UA',
    de: 'de_DE',
    es: 'es_ES',
    fr: 'fr_FR',
    it: 'it_IT',
    pt: 'pt_PT',
    nl: 'nl_NL',
    tr: 'tr_TR',
    ja: 'ja_JP',
    zh: 'zh_CN',
    ko: 'ko_KR',
};

export const ogLocale = (locale: string) => OG_LOCALES[locale as Locale] ?? OG_LOCALES.en;

/** Search snippets are cut around 160 characters: end on a word, with an ellipsis. */
export function truncate(text: string, max = 160) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;

    const cut = clean.slice(0, max - 1);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).trimEnd()}…`;
}

/**
 * `generateMetadata` for a static page: its title in the viewer's language.
 * Account and transactional pages stay out of search results unless `index`.
 */
export function pageMetadata(key: PageKey, { index = false }: { index?: boolean } = {}) {
    return async (): Promise<Metadata> => {
        const t = await getTranslations('meta.pages');
        return { title: t(key), ...(index ? {} : { robots: NO_INDEX }) };
    };
}

type SocialOptions = {
    title: string;
    description: string;
    /** Canonical path of the page, e.g. `/collections/42`. */
    path: string;
    type?: 'website' | 'article' | 'profile';
    /** `article`: when it was published, who made it, its tags. */
    publishedTime?: string;
    authors?: string[];
    tags?: string[];
    /** `profile`: the @handle. */
    username?: string;
};

/**
 * Canonical URL plus Open Graph / Twitter tags of a public page. A page's
 * `openGraph` replaces the layout's, so the shared fields are repeated; the
 * image comes from the nearest `opengraph-image`.
 */
export async function socialMetadata({
    title,
    description,
    path,
    type = 'website',
    publishedTime,
    authors,
    tags,
    username,
}: SocialOptions): Promise<Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'>> {
    const common = {
        siteName: SITE_NAME,
        locale: ogLocale(await getLocale()),
        title,
        description,
        url: path,
    };

    const openGraph: Metadata['openGraph'] =
        type === 'article'
            ? { ...common, type, publishedTime, authors, tags }
            : type === 'profile'
              ? { ...common, type, username }
              : { ...common, type };

    return {
        alternates: { canonical: path },
        openGraph,
        twitter: { card: 'summary_large_image', title, description },
    };
}
