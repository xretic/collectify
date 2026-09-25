'use client';

import { create } from 'zustand';
import { useRealtimeEvent } from '@/shared/lib/realtime/RealtimeProvider';

/** The indicator goes away once the peer has been quiet this long. */
const TYPING_TIMEOUT_MS = 2_000;

const timers = new Map<number, ReturnType<typeof setTimeout>>();

type TypingState = {
    /** Chats whose other participant is typing right now. */
    typing: Record<number, true>;
    start: (chatId: number) => void;
    stop: (chatId: number) => void;
};

export const useTypingStore = create<TypingState>((set, get) => ({
    typing: {},
    start: (chatId) => {
        clearTimeout(timers.get(chatId));
        timers.set(
            chatId,
            setTimeout(() => get().stop(chatId), TYPING_TIMEOUT_MS),
        );
        if (!get().typing[chatId])
            set((state) => ({ typing: { ...state.typing, [chatId]: true } }));
    },
    stop: (chatId) => {
        clearTimeout(timers.get(chatId));
        timers.delete(chatId);
        if (!get().typing[chatId]) return;
        set((state) => {
            const next = { ...state.typing };
            delete next[chatId];
            return { typing: next };
        });
    },
}));

/** Whether the other participant of `chatId` is typing. */
export function useIsTyping(chatId: number | null | undefined) {
    return useTypingStore((state) => (chatId ? Boolean(state.typing[chatId]) : false));
}

/** Tracks `chat:typing` pings of every chat; mount once on pages that show typing. */
export function useTypingUpdates(viewerId: number | undefined) {
    const start = useTypingStore((state) => state.start);
    const stop = useTypingStore((state) => state.stop);

    // The server only sends a chat's pings to the other participant.
    useRealtimeEvent('chat:typing', ({ chatId }) => start(chatId));

    // Their message has arrived, so they are no longer typing it.
    useRealtimeEvent('message:new', (message) => {
        if (message.author.id !== viewerId) stop(message.chatId);
    });
}
