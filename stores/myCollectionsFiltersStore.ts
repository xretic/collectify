import { create } from 'zustand';

export type MyCollectionsVisibility = 'public' | 'private';

type MyCollectionsFiltersState = {
    visibility: MyCollectionsVisibility;
    category: string;
    query: string;

    setVisibility: (visibility: MyCollectionsVisibility) => void;
    setCategory: (category: string) => void;
    setQuery: (query: string) => void;
    resetFilters: () => void;
};

export const useMyCollectionsFiltersStore = create<MyCollectionsFiltersState>((set) => ({
    visibility: 'public',
    category: '',
    query: '',

    setVisibility: (visibility) => set({ visibility }),
    setCategory: (category) => set({ category }),
    setQuery: (query) => set({ query }),
    resetFilters: () =>
        set({
            visibility: 'public',
            category: '',
            query: '',
        }),
}));