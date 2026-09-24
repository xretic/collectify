'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { collectionApi } from '../api/collectionApi';
import { collectionQueryKeys } from './queryKeys';
import type { CollectionListParams } from './types';

export function useCollectionList(params: CollectionListParams, enabled = true) {
    return useQuery({
        queryKey: collectionQueryKeys.list(params),
        queryFn: () => collectionApi.list(params),
        enabled,
        placeholderData: keepPreviousData,
    });
}
