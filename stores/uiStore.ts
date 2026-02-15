import { create } from 'zustand';

type SortType = 'popular' | 'newest' | 'old';

interface UIState {
    anchorEl: HTMLElement | null;
    setAnchorEl: (el: HTMLElement | null) => void;

    commentAnchorEl: HTMLElement | null;
    setCommentAnchorEl: (el: HTMLElement | null) => void;


    commentId: number | null;
    setCommentId: (id: number) => void;

    searchBarOpened: boolean;
    setSearchBarOpened: () => void;

    loadingCount: number;
    startLoading: () => void;
    stopLoading: () => void;

    sortedBy: SortType;
    setSortedBy: (value: SortType) => void;

    itemDeletionId: number;
    setItemDeletionId: (value: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
    anchorEl: null,
    setAnchorEl: (el) => set({ anchorEl: el }),

    commentAnchorEl: null,
    setCommentAnchorEl: (el) => set({ commentAnchorEl: el }),

    commentId: null,
    setCommentId: (id: number) => set({ commentId: id }),

    searchBarOpened: false,
    setSearchBarOpened: () => set((state) => ({ searchBarOpened: !state.searchBarOpened })),

    loadingCount: 0,
    startLoading: () => set((state) => ({ loadingCount: state.loadingCount + 1 })),
    stopLoading: () =>
        set((state) => ({
            loadingCount: Math.max(0, state.loadingCount - 1),
        })),

    sortedBy: 'popular',
    setSortedBy: (value: SortType) => set(() => ({ sortedBy: value })),

    itemDeletionId: 0,
    setItemDeletionId: (value) => set(() => ({ itemDeletionId: value })),
}));
