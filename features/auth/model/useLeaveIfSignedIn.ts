'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionUser } from '@/entities/user/model/useSessionUser';

/**
 * Sends users who were already signed in when they opened an auth page on to
 * `target`. Signing in on the page itself is left to `useAuthSuccess`, which
 * may go elsewhere (onboarding), so only the first known session state counts.
 */
export function useLeaveIfSignedIn(target: string) {
    const router = useRouter();
    const { user, loading } = useSessionUser();
    const checked = useRef(false);

    useEffect(() => {
        if (loading || checked.current) return;
        checked.current = true;
        if (user) router.replace(target);
    }, [loading, user, router, target]);
}
