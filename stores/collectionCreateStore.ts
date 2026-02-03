import { create } from 'zustand';

interface CollectionCreateState {
    name: string;
    description: string;
    category: string;
    banner: string;
    step: number;
    itemImage: string;
    itemTitle: string;
    itemDescription: string;
    itemSourceUrl: string;

    setField: <K extends keyof Omit<CollectionCreateState, 'setField' | 'reset'>>(
        key: K,
        value: CollectionCreateState[K],
    ) => void;

    reset: () => void;
}

const initialState = {
    name: '',
    description: '',
    category: '',
    banner: '',
    step: 0,
    itemImage: '',
    itemTitle: '',
    itemDescription: '',
    itemSourceUrl: '',
};

export const useCollectionCreateStore = create<CollectionCreateState>((set) => ({
    ...initialState,

    setField: (key, value) =>
        set((state) => ({
            ...state,
            [key]: value,
        })),

    reset: () => set(initialState),
}));
