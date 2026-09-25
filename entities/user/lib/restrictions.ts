'use client';

import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';
import type { UserRestriction } from '../model/types';

/** Placeholder for an input the user is muted from, or `fallback` when not muted. */
export function useMutePlaceholder() {
    const t = useTranslations('sanctions.mutePlaceholder');
    const format = useFormatters();

    return (
        restriction: UserRestriction | undefined,
        place: 'comments' | 'messenger',
        fallback: string,
    ) => {
        if (!restriction?.muted) return fallback;

        return restriction.expiresAt
            ? t(`${place}Until`, { date: format.dateTime(restriction.expiresAt) })
            : t(`${place}Permanent`);
    };
}
