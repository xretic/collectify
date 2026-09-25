'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { categoryQueryKeys } from './queryKeys';

/** Active categories; they rarely change, so they are cached for the session. */
export function useCategories() {
    const query = useQuery({
        queryKey: categoryQueryKeys.active(),
        queryFn: categoryApi.list,
        staleTime: 10 * 60_000,
    });

    const categories = useMemo(() => query.data ?? [], [query.data]);
    const bySlug = useMemo(
        () => new Map(categories.map((category) => [category.slug, category])),
        [categories],
    );

    return { ...query, categories, bySlug };
}
