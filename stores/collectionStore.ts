import { CollectionPropsAdditional } from '@/types/CollectionField';
import { create } from 'zustand';

type CollectionSetter =
    | CollectionPropsAdditional
    | null
    | ((prev: CollectionPropsAdditional | null) => CollectionPropsAdditional | null);

type CommentType = {
    id: number;
    userId: number;
    username: string;
    avatarUrl: string;
    createdAt: string;
    text: string;
};

interface CollectionState {
    collection: CollectionPropsAdditional | null;
    comments: CommentType[] | null;
    setCollection: (value: CollectionSetter) => void;
    setComments: (comments: CommentType[] | null) => void;
    addComments: (comments: CommentType[]) => void;
    reset: () => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
    collection: null,
    comments: null,

    setCollection: (value) =>
        set((state) => ({
            collection: typeof value === 'function' ? value(state.collection) : value,
        })),

    setComments: (comments) => set({ comments }),

    addComments: (comments) =>
        set((state) => {
            const prev = state.comments ?? [];
            const merged = [...prev, ...comments];
            const uniq = Array.from(new Map(merged.map((c) => [c.id, c])).values());
            return { comments: uniq };
        }),

    reset: () =>
        set({
            collection: null,
            comments: null,
        }),
}));
