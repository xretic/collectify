import type { CollectionListParams } from './types';

export const collectionQueryKeys = {
    all: ['collections'] as const,
    lists: () => [...collectionQueryKeys.all, 'list'] as const,
    list: (params: CollectionListParams) => [...collectionQueryKeys.lists(), params] as const,
    detail: (id: number) => [...collectionQueryKeys.all, 'detail', id] as const,
    comments: (id: number) => [...collectionQueryKeys.all, 'comments', id] as const,
    stats: (id: number) => [...collectionQueryKeys.all, 'stats', id] as const,
};
