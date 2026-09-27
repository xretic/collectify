'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@/entities/user/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { useLocale } from 'next-intl';
import { safeNextPath } from '@/shared/lib/safeNextPath';

/**
 * Signs the user in on the client and leaves the auth page: to `?next=` (the
 * page a guest came from), or wherever `redirectTo` sends them given that
 * target (new accounts see onboarding first).
 */
export function useAuthSuccess(redirectTo?: string | ((next: string) => string)) {
    const router = useRouter();
    const locale = useLocale();
    const queryClient = useQueryClient();
    const next = safeNextPath(useSearchParams().get('next'));

    return (user: SessionUser) => {
        queryClient.clear();
        queryClient.setQueryData(sessionUserQueryKey, user);
        router.replace(typeof redirectTo === 'function' ? redirectTo(next) : (redirectTo ?? next));
        // The server switched the language cookie to the account's language.
        if (user.locale !== locale) router.refresh();
    };
}
