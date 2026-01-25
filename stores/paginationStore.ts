import { create } from 'zustand';

interface PaginationState {
    homePagination: number;
    setHomePagination: (newPagintion: number) => void;

    profilePagination: number;
    setProfilePagination: (newPagintion: number) => void;
}

export const usePaginationStore = create<PaginationState>((set) => ({
    homePagination: 0,
    setHomePagination: (newPagintion) => set({ homePagination: newPagintion }),

    profilePagination: 0,
    setProfilePagination: (newPagintion) => set({ profilePagination: newPagintion }),
}));
