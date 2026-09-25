/** Shared by the server (request config, API) and the client (language pickers). */

export const LOCALES = [
    'en',
    'cs',
    'pl',
    'uk',
    'de',
    'es',
    'fr',
    'it',
    'pt',
    'nl',
    'tr',
    'ja',
    'zh',
    'ko',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Remembers the language for guests and mirrors `User.locale` for signed-in users. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Each language in its own name, so people can find theirs whatever the UI language is. */
export const LOCALE_NAMES: Record<Locale, string> = {
    en: 'English',
    cs: 'Čeština',
    pl: 'Polski',
    uk: 'Українська',
    de: 'Deutsch',
    es: 'Español',
    fr: 'Français',
    it: 'Italiano',
    pt: 'Português',
    nl: 'Nederlands',
    tr: 'Türkçe',
    ja: '日本語',
    zh: '中文',
    ko: '한국어',
};

export const isLocale = (value: unknown): value is Locale =>
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** Best supported match for an `Accept-Language` header ("uk-UA,uk;q=0.9,en;q=0.8"). */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
    const ranked = (acceptLanguage ?? '')
        .split(',')
        .map((part) => {
            const [tag, ...params] = part.trim().split(';');
            const q = params.find((param) => param.trim().startsWith('q='));
            return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
        })
        .filter((entry) => entry.tag && entry.q > 0)
        .sort((a, b) => b.q - a.q);

    for (const { tag } of ranked) {
        const base = tag.split('-')[0];
        if (isLocale(base)) return base;
    }

    return DEFAULT_LOCALE;
}
