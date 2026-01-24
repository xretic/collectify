import { create } from 'zustand';

interface CollectionSearchState {
    query: string;
    setQuery: (queryValue: string) => void;
    resetQuery: () => void;
}

export const useCollectionSearchStore = create<CollectionSearchState>((set) => ({
    query: '',
    setQuery: (queryValue) => set({ query: queryValue }),
    resetQuery: () => set({ query: '' }),
}));
