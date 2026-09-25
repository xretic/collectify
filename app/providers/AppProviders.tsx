'use client';

import { useState, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/shared/config/theme';
import { RealtimeProvider } from '@/shared/lib/realtime/RealtimeProvider';
import { useSessionUser } from '@/entities/user/model/useSessionUser';

export function AppProviders({ children }: { children: ReactNode }) {
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
                    <SessionRealtime>{children}</SessionRealtime>
                </QueryClientProvider>
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}

function SessionRealtime({ children }: { children: ReactNode }) {
    const { user } = useSessionUser();
    // The server refuses realtime for impersonated sessions (it carries direct messages).
    const userId = user && !user.impersonatorUserId ? user.id : undefined;

    return <RealtimeProvider userId={userId}>{children}</RealtimeProvider>;
}
