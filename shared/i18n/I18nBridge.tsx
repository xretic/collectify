'use client';

import { useTranslations } from 'next-intl';
import type { LooseTranslator } from './types';
import { setGlobalTranslator } from './translator';

/** Keeps the module-level translator in sync with the active language. */
export function I18nBridge() {
    const t = useTranslations() as unknown as LooseTranslator;
    // Browser only: on the server this module state would be shared between requests.
    if (typeof window !== 'undefined') setGlobalTranslator(t);

    return null;
}
