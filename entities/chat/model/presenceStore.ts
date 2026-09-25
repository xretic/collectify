'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';
import { chatApi } from '../api/chatApi';
import { chatQueryKeys } from './queryKeys';
import type { ChatPeer } from './types';

/**
 * Changes arrive as `presence:changed` events; polling is only the safety net for
 * a missed or never sent update, so it stays slow (it runs in every open tab).
 */
const PRESENCE_REFRESH_MS = 60_000;

type PresenceEntry = { online: boolean; at: number };

type PresenceState = {
    /** userId → latest known status and when it was observed. */
    online: Record<number, PresenceEntry>;
    /** Applies statuses observed at `at`, skipping those older than what is stored. */
    setOnline: (entries: Record<number, boolean>, at: number) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
    online: {},
    setOnline: (entries, at) =>
        set((state) => {
            const next = { ...state.online };
            for (const [id, online] of Object.entries(entries)) {
                const current = next[Number(id)];
                if (!current || current.at <= at) next[Number(id)] = { online, at };
            }
            return { online: next };
        }),
}));

/** Live online status of a chat partner. */
export function useIsOnline(user: ChatPeer | null | undefined) {
    return usePresenceStore((state) =>
        user ? (state.online[user.id]?.online ?? user.online) : false,
    );
}

/**
 * Stores the statuses of a server response fetched at `fetchedAt` (the query's
 * `dataUpdatedAt`), so a cached response never overrides a newer status.
 */
export function useSyncPresence(users: (ChatPeer | null)[] | undefined, fetchedAt: number) {
    const setOnline = usePresenceStore((state) => state.setOnline);

    useEffect(() => {
        if (!users?.length) return;
        setOnline(
            Object.fromEntries(users.flatMap((user) => (user ? [[user.id, user.online]] : []))),
            fetchedAt,
        );
    }, [users, fetchedAt, setOnline]);
}

/** Keeps every chat partner's status current; mount once on pages that show presence. */
export function usePresenceUpdates() {
    const setOnline = usePresenceStore((state) => state.setOnline);

    useRealtimeEvent('presence:changed', ({ userId, online }) =>
        setOnline({ [userId]: online }, Date.now()),
    );

    const query = useQuery({
        queryKey: chatQueryKeys.presence(),
        queryFn: chatApi.presence,
        staleTime: 0,
        refetchInterval: PRESENCE_REFRESH_MS,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (query.data) setOnline(query.data, query.dataUpdatedAt);
    }, [query.data, query.dataUpdatedAt, setOnline]);
}
