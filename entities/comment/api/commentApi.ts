import { api } from '@/shared/api/api';

export const commentApi = {
    update(commentId: string | number, text: string) {
        return api.patch(`api/comments/${commentId}`, { json: { text } });
    },

    delete(commentId: string | number) {
        return api.delete(`api/comments/${commentId}`);
    },
};
