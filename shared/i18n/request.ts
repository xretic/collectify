import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import {
    DEFAULT_LOCALE,
    isLocale,
    LOCALE_COOKIE,
    matchLocale,
    type Locale,
} from '@/shared/config/i18n';
import en from './messages/en.json';

type Messages = Record<string, unknown>;

/** Missing translations fall back to English instead of showing raw keys. */
function withFallback(base: Messages, override: Messages): Messages {
    const result: Messages = { ...base };

    for (const [key, value] of Object.entries(override)) {
        const fallback = base[key];
        result[key] =
            value && typeof value === 'object' && fallback && typeof fallback === 'object'
                ? withFallback(fallback as Messages, value as Messages)
                : value;
    }

    return result;
}

async function loadMessages(locale: Locale): Promise<Messages> {
    if (locale === DEFAULT_LOCALE) return en;

    const translated = (await import(`./messages/${locale}.json`)).default as Messages;
    return withFallback(en, translated);
}

/** Cookie first (explicit choice / account setting), then the browser languages. */
export async function resolveLocale(): Promise<Locale> {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(cookieLocale)) return cookieLocale;

    return matchLocale((await headers()).get('accept-language'));
}

export default getRequestConfig(async () => {
    const locale = await resolveLocale();

    return { locale, messages: await loadMessages(locale) };
});
