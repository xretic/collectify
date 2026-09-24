'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '../api/collectionApi';
import { collectionQueryKeys } from './queryKeys';
import type { CollectionDetails } from './types';

export function useCollectionDetails(collectionId: number) {
    return useQuery({
        queryKey: collectionQueryKeys.detail(collectionId),
        queryFn: () => collectionApi.getById(collectionId),
        enabled: Number.isInteger(collectionId) && collectionId > 0,
        retry: false,
    });
}

/** Helpers to patch the cached collection after a mutation and refresh lists. */
export function useCollectionCache(collectionId: number) {
    const queryClient = useQueryClient();
    const key = collectionQueryKeys.detail(collectionId);

    const update = useCallback(
        (updater: (collection: CollectionDetails) => CollectionDetails) =>
            queryClient.setQueryData<CollectionDetails>(
                key,
                (current) => current && updater(current),
            ),
        [key, queryClient],
    );

    const snapshot = useCallback(
        () => queryClient.getQueryData<CollectionDetails>(key),
        [key, queryClient],
    );

    const restore = useCallback(
        (previous: CollectionDetails | undefined) =>
            previous && queryClient.setQueryData(key, previous),
        [key, queryClient],
    );

    const invalidateLists = useCallback(
        () => queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() }),
        [queryClient],
    );

    return { key, update, snapshot, restore, invalidateLists };
}
