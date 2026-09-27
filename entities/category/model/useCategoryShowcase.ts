'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../api/categoryApi';
import { categoryQueryKeys } from './queryKeys';

/** Active categories with a cover from one of their popular collections (picked once per visit). */
export function useCategoryShowcase() {
    return useQuery({
        queryKey: [...categoryQueryKeys.all, 'showcase'],
        queryFn: categoryApi.showcase,
        staleTime: Infinity,
    });
}
