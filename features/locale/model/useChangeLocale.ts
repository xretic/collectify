'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/entities/auth/api/authApi';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import type { Locale } from '@/shared/config/i18n';

/**
 * Switches the UI language: the server stores it (cookie + account) and the
 * refreshed server render brings the new messages. Client state is kept.
 */
export function useChangeLocale() {
    const locale = useLocale();
    const router = useRouter();
    const { setUser } = useSessionUser();
    const [refreshing, startTransition] = useTransition();

    const mutation = useMutation({
        mutationFn: authApi.setLocale,
        onSuccess: (_, next) => {
            setUser((user) => (user ? { ...user, locale: next } : user));
            startTransition(() => router.refresh());
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return {
        locale,
        changeLocale: (next: Locale) => {
            if (next !== locale) mutation.mutate(next);
        },
        pending: mutation.isPending || refreshing,
    };
}
