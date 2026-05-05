import { create } from 'zustand';

interface PaginationState {
    homePagination: number;
    setHomePagination: (newPagination: number) => void;

    profilePagination: number;
    setProfilePagination: (newPagination: number) => void;

    myCollectionsPagination: number;
    setMyCollectionsPagination: (newPagination: number) => void;
}

export const usePaginationStore = create<PaginationState>((set) => ({
    homePagination: 0,
    setHomePagination: (newPagination) => set({ homePagination: newPagination }),

    profilePagination: 0,
    setProfilePagination: (newPagination) => set({ profilePagination: newPagination }),

    myCollectionsPagination: 0,
    setMyCollectionsPagination: (newPagination) => set({ myCollectionsPagination: newPagination }),
}));
