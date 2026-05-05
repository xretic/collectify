import { create } from 'zustand';

interface CollectionEditDialogState {
    open: boolean;
    setOpenEditing: (value: boolean) => void;
}

export const useEditingDialogStore = create<CollectionEditDialogState>((set) => ({
    open: false,
    setOpenEditing: (value) => set({ open: value }),
}));
