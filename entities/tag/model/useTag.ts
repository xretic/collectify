'use client';

import { useQueries } from '@tanstack/react-query';
import { tagApi } from '../api/tagApi';
import { tagQueryKeys } from './queryKeys';

const tagQuery = (tagId: number) => ({
    queryKey: tagQueryKeys.detail(tagId),
    queryFn: () => tagApi.get(tagId),
    staleTime: 10 * 60_000,
});

/** Several tags by id, in the given order; unresolved ones are `undefined`. */
export function useTags(tagIds: number[]) {
    return useQueries({
        queries: tagIds.map(tagQuery),
        combine: (results) => results.map((result) => result.data),
    });
}
