import { api } from '@/shared/api/api';
import type { CommentsPage, CollectionComment } from '@/entities/comment/model/types';
import type {
    CollectionDetails,
    CollectionItem,
    CollectionItemPayload,
    CollectionListPage,
    CollectionListParams,
    CollectionStats,
    CreateCollectionPayload,
    UpdateCollectionPayload,
} from '../model/types';

const url = (collectionId: number | string) => `collections/${collectionId}`;

function toSearchParams(params: CollectionListParams) {
    const searchParams = new URLSearchParams({ sort: params.sort, page: String(params.page) });

    if (params.category) searchParams.set('category', params.category);
    if (params.query) searchParams.set('query', params.query);
    if (params.authorId) searchParams.set('authorId', String(params.authorId));
    if (params.visibility) searchParams.set('visibility', params.visibility);
    if (params.favorites) searchParams.set('favorites', 'true');

    return searchParams;
}

export const collectionApi = {
    list(params: CollectionListParams) {
        return api
            .get('collections', { searchParams: toSearchParams(params) })
            .json<CollectionListPage>();
    },

    async getById(collectionId: number | string) {
        return (await api.get(url(collectionId)).json<{ collection: CollectionDetails }>())
            .collection;
    },

    async create(payload: CreateCollectionPayload) {
        return (await api.post('collections', { json: payload }).json<{ id: number }>()).id;
    },

    async update(collectionId: number, payload: UpdateCollectionPayload) {
        return (
            await api
                .patch(url(collectionId), { json: payload })
                .json<{ collection: CollectionDetails }>()
        ).collection;
    },

    async delete(collectionId: number) {
        await api.delete(url(collectionId));
    },

    async setLiked(collectionId: number, liked: boolean) {
        const path = `${url(collectionId)}/like`;
        await (liked ? api.put(path) : api.delete(path));
    },

    async setFavorited(collectionId: number, favorited: boolean) {
        const path = `${url(collectionId)}/favorite`;
        await (favorited ? api.put(path) : api.delete(path));
    },

    comments(collectionId: number | string, cursor: number | null) {
        return api
            .get(`${url(collectionId)}/comments`, { searchParams: cursor ? { cursor } : {} })
            .json<CommentsPage>();
    },

    async addComment(collectionId: number, text: string) {
        return (
            await api
                .post(`${url(collectionId)}/comments`, { json: { text } })
                .json<{ comment: CollectionComment }>()
        ).comment;
    },

    async addItem(collectionId: number, payload: CollectionItemPayload) {
        return (
            await api
                .post(`${url(collectionId)}/items`, { json: payload })
                .json<{ item: CollectionItem }>()
        ).item;
    },

    async updateItem(collectionId: number, itemId: number, payload: CollectionItemPayload) {
        return (
            await api
                .patch(`${url(collectionId)}/items/${itemId}`, { json: payload })
                .json<{ item: CollectionItem }>()
        ).item;
    },

    async deleteItem(collectionId: number, itemId: number) {
        await api.delete(`${url(collectionId)}/items/${itemId}`);
    },

    async reorderItems(collectionId: number, itemIds: number[]) {
        await api.put(`${url(collectionId)}/items/order`, { json: { itemIds } });
    },

    stats(collectionId: number) {
        return api.get(`${url(collectionId)}/stats`).json<CollectionStats>();
    },
};
