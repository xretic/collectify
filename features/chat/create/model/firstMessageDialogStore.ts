import { create } from 'zustand';

interface FirstMessageDialogState {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export const useFirstMessageDialogStore = create<FirstMessageDialogState>((set) => ({
    open: false,
    setOpen: (value) => set({ open: value }),
}));
