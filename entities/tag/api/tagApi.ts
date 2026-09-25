import { api } from '@/shared/api/api';
import type { Tag } from '../model/types';

export const tagApi = {
    /** `categoryId` omitted: search every category. */
    async search(categoryId: number | undefined, query: string) {
        const searchParams = categoryId ? { categoryId, query } : { query };
        return (await api.get('tags', { searchParams }).json<{ tags: Tag[] }>()).tags;
    },

    async get(tagId: number) {
        return (await api.get(`tags/${tagId}`).json<{ tag: Tag }>()).tag;
    },

    async delete(tagId: number) {
        await api.delete(`management/tags/${tagId}`);
    },

    async create(categoryId: number, name: string) {
        return (await api.post('tags', { json: { categoryId, name } }).json<{ tag: Tag }>()).tag;
    },
};
