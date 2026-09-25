'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
    formatChatTimestamp,
    formatDate,
    formatDateTime,
    formatRelative,
    formatShortRelative,
} from './date';
import { formatCompact } from './number';

/** Date and number formatters bound to the active UI language. */
export function useFormatters() {
    const locale = useLocale();

    return useMemo(
        () => ({
            relative: (value: string | Date, now?: number) => formatRelative(locale, value, now),
            shortRelative: (value: string | Date, now?: number) =>
                formatShortRelative(locale, value, now),
            chatTimestamp: (value: string | Date, now?: number) =>
                formatChatTimestamp(locale, value, now),
            dateTime: (value: string | Date) => formatDateTime(locale, value),
            date: (value: string | Date) => formatDate(locale, value),
            compact: (value: number) => formatCompact(locale, value),
        }),
        [locale],
    );
}
