import { create } from 'zustand';

type SortType = 'popular' | 'newest' | 'old';

interface UIState {
    anchorEl: HTMLElement | null;
    setAnchorEl: (el: HTMLElement | null) => void;
    resetAnchorEl: () => void;

    searchBarOpened: boolean;
    setSearchBarOpened: () => void;
    resetSearchBarOpened: () => void;

    loadingCount: number;
    startLoading: () => void;
    stopLoading: () => void;

    sortedBy: SortType;
    setSortedBy: (value: SortType) => void;
}

export const useUIStore = create<UIState>((set) => ({
    anchorEl: null,
    setAnchorEl: (el) => set({ anchorEl: el }),
    resetAnchorEl: () => set({ anchorEl: null }),

    searchBarOpened: false,
    setSearchBarOpened: () => set((state) => ({ searchBarOpened: !state.searchBarOpened })),
    resetSearchBarOpened: () => set(() => ({ searchBarOpened: false })),

    loadingCount: 0,
    startLoading: () => set((state) => ({ loadingCount: state.loadingCount + 1 })),
    stopLoading: () =>
        set((state) => ({
            loadingCount: Math.max(0, state.loadingCount - 1),
        })),

    sortedBy: 'popular',
    setSortedBy: (value: SortType) => set(() => ({ sortedBy: value })),
}));
