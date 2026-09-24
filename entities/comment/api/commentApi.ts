import { api } from '@/shared/api/api';
import type { CollectionComment } from '../model/types';

export const commentApi = {
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
};
