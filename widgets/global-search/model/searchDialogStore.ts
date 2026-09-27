'use client';

import { create } from 'zustand';

type SearchDialogState = {
    open: boolean;
    show: () => void;
    close: () => void;
};

/** The search dialog is opened from the navbar, the mobile tab bar and ⌘K. */
export const useSearchDialogStore = create<SearchDialogState>((set) => ({
    open: false,
    show: () => set({ open: true }),
    close: () => set({ open: false }),
}));
