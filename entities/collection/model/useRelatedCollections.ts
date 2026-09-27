'use client';

import { useQuery } from '@tanstack/react-query';
import { collectionApi } from '../api/collectionApi';
import { collectionQueryKeys } from './queryKeys';

export function useRelatedCollections(collectionId: number) {
    return useQuery({
        queryKey: collectionQueryKeys.related(collectionId),
        queryFn: () => collectionApi.related(collectionId),
        staleTime: 5 * 60_000,
    });
}
