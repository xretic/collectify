'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` while rendering on the server and while hydrating, `true` after.
 * Lets a component render exactly what the server did first, then switch to
 * client-only state (session, storage, platform) without a hydration mismatch.
 */
export function useHydrated() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
