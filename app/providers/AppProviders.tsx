'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import {
    HydrationBoundary,
    QueryClient,
    QueryClientProvider,
    type DehydratedState,
} from '@tanstack/react-query';
import { localizedTheme } from '@/shared/config/theme';
import { RealtimeProvider } from '@/shared/lib/realtime/RealtimeProvider';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { authApi } from '@/entities/auth/api/authApi';

type AppProvidersProps = {
    children: ReactNode;
    /** Server-loaded queries every page needs (session user, categories). */
    state: DehydratedState;
    /** The session cookie points at a session that no longer exists. */
    staleSession: boolean;
};

export function AppProviders({ children, state, staleSession }: AppProvidersProps) {
    const locale = useLocale();
    useDropStaleSession(staleSession);
    const theme = useMemo(() => localizedTheme(locale), [locale]);
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
                },
            }),
    );

    return (
        <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
                <QueryClientProvider client={queryClient}>
                    <HydrationBoundary state={state}>
                        <SessionRealtime>{children}</SessionRealtime>
                    </HydrationBoundary>
                </QueryClientProvider>
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}

/** Drops a dead session cookie, so private pages redirect to sign-in again. */
function useDropStaleSession(stale: boolean) {
    useEffect(() => {
        if (stale) authApi.logout().catch(() => {});
    }, [stale]);
}

function SessionRealtime({ children }: { children: ReactNode }) {
    const { user } = useSessionUser();
    // The server refuses realtime for impersonated sessions (it carries direct messages).
    const userId = user && !user.impersonatorUserId ? user.id : undefined;

    return <RealtimeProvider userId={userId}>{children}</RealtimeProvider>;
}
