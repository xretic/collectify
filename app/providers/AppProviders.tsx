'use client';

import { useState, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/shared/config/theme';
import { RealtimeProvider } from '@/entities/chat/model/RealtimeProvider';

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
                    <RealtimeProvider>{children}</RealtimeProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}
