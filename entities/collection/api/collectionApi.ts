import { api } from '@/shared/api/api';
import {
    CollectionActionType,
    CollectionFieldProps,
    CollectionItemPayload,
    CollectionOrderItem,
    CollectionPropsAdditional,
    CollectionSearchParams,
    CollectionStats,
    CreateCollectionPayload,
} from '@/entities/collection/model/types';

type CollectionResponse = {
    data: CollectionPropsAdditional;
};

const collectionUrl = (collectionId: string | number) => `api/collections/${collectionId}`;

function buildCollectionSearchParams(params: CollectionSearchParams) {
    const searchParams = new URLSearchParams({
        sortedBy: String(params.sortedBy),
        skip: String(params.skip),
        privateOnly: String(params.privateOnly),
    });

    if (params.category) searchParams.set('category', params.category);
    if (params.userId != null) searchParams.set('userId', String(params.userId));
    if (params.query) searchParams.set('query', params.query);
    if (params.authorId != null) searchParams.set('authorId', String(params.authorId));
    if (params.favoritesUserId != null) {
        searchParams.set('favoritesUserId', String(params.favoritesUserId));
    }
    if (params.followed) searchParams.set('followed', 'true');

    return searchParams;
}

export const collectionApi = {
    async search(params: CollectionSearchParams) {
        const searchParams = buildCollectionSearchParams(params);
        const res = await api
            .get(`api/collections/search/?${searchParams.toString()}`)
            .json<{ data: CollectionFieldProps[] }>();

        return res.data;
    },

    async create(payload: CreateCollectionPayload) {
        return api.post('api/collections', { json: payload }).json<{ id: number }>();
    },

    async getById(collectionId: string | number, commentsSkip = 0) {
        const res = await api
            .get(`${collectionUrl(collectionId)}/action`, {
                searchParams: { commentsSkip },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async updateAction(collectionId: string | number, action: CollectionActionType) {
        const res = await api
            .patch(`${collectionUrl(collectionId)}/action`, {
                searchParams: { actionType: action, commentsSkip: 0 },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async createComment(collectionId: string | number, text: string) {
        const res = await api
            .post(`${collectionUrl(collectionId)}/comment`, {
                json: { text },
                searchParams: { commentsSkip: 0 },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async updateOrder(collectionId: string | number, items: CollectionOrderItem[]) {
        await api.patch(`${collectionUrl(collectionId)}/order`, { json: { items } });
    },

    async createItem(collectionId: string | number, payload: CollectionItemPayload) {
        const res = await api
            .post(`${collectionUrl(collectionId)}/items`, {
                json: payload,
                searchParams: { commentsSkip: 0 },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async updateItem(
        collectionId: string | number,
        itemId: string | number,
        payload: CollectionItemPayload,
    ) {
        const res = await api
            .patch(`${collectionUrl(collectionId)}/items`, {
                json: payload,
                searchParams: { itemId, commentsSkip: 0 },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async deleteItem(collectionId: string | number, itemId: string | number) {
        const res = await api
            .delete(`${collectionUrl(collectionId)}/items`, {
                searchParams: { itemId, commentsSkip: 0 },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async updateDetails(
        collectionId: string | number,
        payload: {
            title: string;
            description: string;
            bannerUrl: string | null;
            isPrivate: boolean;
        },
    ) {
        const res = await api
            .patch(`${collectionUrl(collectionId)}/edit`, {
                json: payload,
                searchParams: { commentsSkip: 0 },
            })
            .json<CollectionResponse>();

        return res.data;
    },

    async getStats(collectionId: string | number) {
        return api.get(`${collectionUrl(collectionId)}/stats`).json<CollectionStats>();
    },

    delete(collectionId: string | number) {
        return api.delete(`${collectionUrl(collectionId)}/delete`);
    },
};
