'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { uniqueById } from '@/shared/lib/uniqueById';
import { collectionApi } from '../api/collectionApi';
import { collectionQueryKeys } from './queryKeys';
import type { CollectionListParams } from './types';

/** Infinite version of the collection list (home feed). */
export function useCollectionFeed(params: Omit<CollectionListParams, 'page'>, enabled = true) {
    const query = useInfiniteQuery({
        queryKey: [...collectionQueryKeys.lists(), 'feed', params] as const,
        queryFn: ({ pageParam }) => collectionApi.list({ ...params, page: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
        enabled,
    });

    return {
        ...query,
        collections: uniqueById(query.data?.pages.flatMap((page) => page.data) ?? []),
    };
}
