'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import { tagApi } from '../api/tagApi';
import { tagQueryKeys } from './queryKeys';

/**
 * Debounced tag suggestions for a category (popular ones while the query is
 * empty). Disabled without a category unless `anyCategory` searches them all.
 */
export function useTagSearch(categoryId: number | null, input: string, anyCategory = false) {
    const query = useDebounce(input.trim(), 250);

    return useQuery({
        queryKey: tagQueryKeys.search(categoryId ?? 0, query),
        queryFn: () => tagApi.search(categoryId ?? undefined, query),
        enabled: categoryId !== null || anyCategory,
        placeholderData: keepPreviousData,
        staleTime: 60_000,
    });
}
