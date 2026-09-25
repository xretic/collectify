'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@/entities/user/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';

/** Only same-site relative paths are allowed as redirect targets (no open redirect). */
function safeNext(value: string | null) {
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

/** `redirectTo` overrides `?next=` (e.g. new accounts go to onboarding first). */
export function useAuthSuccess(redirectTo?: string) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const next = safeNext(useSearchParams().get('next'));

    return (user: SessionUser) => {
        queryClient.clear();
        queryClient.setQueryData(sessionUserQueryKey, user);
        router.replace(redirectTo ?? next);
    };
}
