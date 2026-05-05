import { create } from 'zustand';

interface CommentEditState {
    editingCommentId: number | null;
    setEditingComment: (value: number) => void;
    resetEditingComment: () => void;
}

export const useCommentEditStore = create<CommentEditState>((set) => ({
    editingCommentId: null,
    setEditingComment: (value) => set({ editingCommentId: value }),
    resetEditingComment: () => set({ editingCommentId: null }),
}));
