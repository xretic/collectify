import { CollectionPropsAdditional } from '@/types/CollectionField';
import { create } from 'zustand';

type CollectionSetter =
    | CollectionPropsAdditional
    | null
    | ((prev: CollectionPropsAdditional | null) => CollectionPropsAdditional | null);

interface CollectionState {
    collection: CollectionPropsAdditional | null;
    setCollection: (value: CollectionSetter) => void;
    reset: () => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
    collection: null,
    setCollection: (value) =>
        set((state) => ({
            collection: typeof value === 'function' ? value(state.collection) : value,
        })),
    reset: () => set({ collection: null }),
}));
