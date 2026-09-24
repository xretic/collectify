'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { useCallback } from 'react';
import { authApi } from '@/entities/auth/api/authApi';
import type { SessionUser } from './types';

export const sessionUserQueryKey = ['session-user'] as const;

async function fetchSessionUser(): Promise<SessionUser | null> {
    try {
        return await authApi.me();
    } catch (error) {
        // Not signed in / session expired / banned: treat as a guest.
        if (error instanceof HTTPError && [401, 403].includes(error.response.status)) return null;
        throw error;
    }
}

/** The signed-in user (`null` for guests). Backed by React Query, no provider needed. */
export function useSessionUser() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: sessionUserQueryKey,
        queryFn: fetchSessionUser,
        staleTime: 60_000,
        retry: false,
    });

    const setUser = useCallback(
        (updater: SessionUser | null | ((prev: SessionUser | null) => SessionUser | null)) => {
            queryClient.setQueryData<SessionUser | null>(sessionUserQueryKey, (prev) =>
                typeof updater === 'function' ? updater(prev ?? null) : updater,
            );
        },
        [queryClient],
    );

    const refresh = useCallback(
        () => queryClient.invalidateQueries({ queryKey: sessionUserQueryKey }),
        [queryClient],
    );

    return {
        user: query.data ?? null,
        loading: query.isPending,
        setUser,
        refresh,
    };
}
