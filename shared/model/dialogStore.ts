import { create } from 'zustand';

interface DialogState {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
    open: false,
    setOpen: (value) => set({ open: value }),
}));
