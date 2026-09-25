'use client';

import { useQuery } from '@tanstack/react-query';
import { boardApi } from '../api/boardApi';
import { boardQueryKeys } from './queryKeys';

/** The signed-in user's boards (newest first). */
export function useBoards(enabled = true) {
    return useQuery({
        queryKey: boardQueryKeys.mine(),
        queryFn: boardApi.list,
        enabled,
        staleTime: 60_000,
    });
}
