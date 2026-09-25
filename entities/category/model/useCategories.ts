'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { categoryQueryKeys } from './queryKeys';
import { useCategoryName } from './useCategoryName';

/** Active categories (names in the UI language); cached for the session, they rarely change. */
export function useCategories() {
    const query = useQuery({
        queryKey: categoryQueryKeys.active(),
        queryFn: categoryApi.list,
        staleTime: 10 * 60_000,
    });

    const categoryName = useCategoryName();
    const categories = useMemo(
        () => (query.data ?? []).map((category) => ({ ...category, name: categoryName(category) })),
        [query.data, categoryName],
    );
    const bySlug = useMemo(
        () => new Map(categories.map((category) => [category.slug, category])),
        [categories],
    );

    return { ...query, categories, bySlug };
}
