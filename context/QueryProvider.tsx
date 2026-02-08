'use client';

import { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    const persister =
        typeof window === 'undefined'
            ? undefined
            : createAsyncStoragePersister({
                  key: 'rq-cache',
                  storage: {
                      getItem: async (key) => window.localStorage.getItem(key),
                      setItem: async (key, value) => window.localStorage.setItem(key, value),
                      removeItem: async (key) => window.localStorage.removeItem(key),
                  },
              });

    if (!persister) {
        return <>{children}</>;
    }

    return (
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
            {children}
        </PersistQueryClientProvider>
    );
}
