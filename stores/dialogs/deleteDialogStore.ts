import { create } from 'zustand';

interface DeleteDialogState {
    open: boolean;
    setOpenDialog: (value: boolean) => void;
}

export const useDeleteDialogStore = create<DeleteDialogState>((set) => ({
    open: false,
    setOpenDialog: (value) => set({ open: value }),
}));
