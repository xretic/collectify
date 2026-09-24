import { create } from 'zustand';

export type ToastSeverity = 'success' | 'error' | 'info';

type Toast = { id: number; message: string; severity: ToastSeverity };

type ToastState = {
    current: Toast | null;
    show: (message: string, severity?: ToastSeverity) => void;
    dismiss: () => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
    current: null,
    show: (message, severity = 'info') => set({ current: { id: nextId++, message, severity } }),
    dismiss: () => set({ current: null }),
}));

/** Imperative helpers usable from event handlers and mutation callbacks. */
export const toast = {
    success: (message: string) => useToastStore.getState().show(message, 'success'),
    error: (message: string) => useToastStore.getState().show(message, 'error'),
    info: (message: string) => useToastStore.getState().show(message, 'info'),
};
