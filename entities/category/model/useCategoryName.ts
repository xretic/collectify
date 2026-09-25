'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { LooseTranslator } from '@/shared/i18n/types';

/**
 * Built-in categories are translated by slug; categories created later by
 * admins keep the name they were given.
 */
export function useCategoryName() {
    const t = useTranslations('categories') as unknown as LooseTranslator;

    return useCallback(
        (category: { slug: string; name: string }) =>
            t.has(category.slug) ? t(category.slug) : category.name,
        [t],
    );
}
