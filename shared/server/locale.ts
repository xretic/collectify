import 'server-only';
import type { NextResponse } from 'next/server';
import { isProduction } from '@/shared/server/env';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE_SECONDS, type Locale } from '@/shared/config/i18n';

/** The UI language the next render uses (read by `shared/i18n/request.ts`). */
export function setLocaleCookie(res: NextResponse, locale: Locale) {
    res.cookies.set({
        name: LOCALE_COOKIE,
        value: locale,
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
        maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    });
}
