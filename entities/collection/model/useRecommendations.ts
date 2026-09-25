'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { uniqueById } from '@/shared/lib/uniqueById';
import { collectionApi } from '../api/collectionApi';
import { collectionQueryKeys } from './queryKeys';

/** Infinite "For you" feed, or "more like this board" when `board` is set. */
export function useRecommendations(board: number | undefined, enabled = true) {
    const query = useInfiniteQuery({
        queryKey: [...collectionQueryKeys.lists(), 'recommended', board ?? null] as const,
        queryFn: ({ pageParam }) => collectionApi.recommendations(pageParam, board),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
        enabled,
        staleTime: 5 * 60_000,
    });

    return {
        ...query,
        collections: uniqueById(query.data?.pages.flatMap((page) => page.data) ?? []),
    };
}
