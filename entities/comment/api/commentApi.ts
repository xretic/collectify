import { api } from '@/shared/api/api';
import type { CollectionComment, RepliesPage } from '../model/types';

export const commentApi = {
    replies(commentId: number, cursor: number | null) {
        return api
            .get(`comments/${commentId}/replies`, { searchParams: cursor ? { cursor } : {} })
            .json<RepliesPage>();
    },

    async update(commentId: number, text: string) {
        return (
            await api
                .patch(`comments/${commentId}`, { json: { text } })
                .json<{ comment: CollectionComment }>()
        ).comment;
    },

    async delete(commentId: number) {
        await api.delete(`comments/${commentId}`);
    },

    async setAuthorLike(commentId: number, liked: boolean) {
        const path = `comments/${commentId}/author-like`;
        await (liked ? api.put(path) : api.delete(path));
    },
};
