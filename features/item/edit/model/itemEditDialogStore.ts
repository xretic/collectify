import { CollectionItem } from '@/entities/collection/model/types';
import { create } from 'zustand';

interface ItemEditDialogState {
    open: boolean;
    item: CollectionItem | null;
    openItemEdit: (item: CollectionItem) => void;
    closeItemEdit: () => void;
}

export const useItemEditDialogStore = create<ItemEditDialogState>((set) => ({
    open: false,
    item: null,
    openItemEdit: (item) => set({ open: true, item }),
    closeItemEdit: () => set({ open: false, item: null }),
}));
