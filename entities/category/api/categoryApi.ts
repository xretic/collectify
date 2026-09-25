import { api } from '@/shared/api/api';
import type { Category, CategoryPayload, CategoryShowcase, ManagedCategory } from '../model/types';

export const categoryApi = {
    async list() {
        return (await api.get('categories').json<{ categories: Category[] }>()).categories;
    },

    async showcase() {
        return (await api.get('categories/showcase').json<{ categories: CategoryShowcase[] }>())
            .categories;
    },

    async listManaged() {
        return (await api.get('management/categories').json<{ categories: ManagedCategory[] }>())
            .categories;
    },

    async create(payload: CategoryPayload) {
        return (
            await api
                .post('management/categories', { json: payload })
                .json<{ category: ManagedCategory }>()
        ).category;
    },

    async update(categoryId: number, payload: CategoryPayload) {
        return (
            await api
                .patch(`management/categories/${categoryId}`, { json: payload })
                .json<{ category: ManagedCategory }>()
        ).category;
    },

    async delete(categoryId: number) {
        await api.delete(`management/categories/${categoryId}`);
    },
};
