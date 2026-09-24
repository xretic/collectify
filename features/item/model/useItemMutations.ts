'use client';

import { useMutation } from '@tanstack/react-query';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import type { CollectionItemPayload } from '@/entities/collection/model/types';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

const showError = async (error: unknown) => toast.error(await getApiErrorMessage(error));

export function useItemMutations(collectionId: number) {
    const cache = useCollectionCache(collectionId);

    const add = useMutation({
        mutationFn: (payload: CollectionItemPayload) =>
            collectionApi.addItem(collectionId, payload),
        onSuccess: (item) => {
            cache.update((collection) => ({ ...collection, items: [...collection.items, item] }));
            cache.invalidateLists();
        },
        onError: showError,
    });

    const update = useMutation({
        mutationFn: ({ itemId, payload }: { itemId: number; payload: CollectionItemPayload }) =>
            collectionApi.updateItem(collectionId, itemId, payload),
        onSuccess: (item) =>
            cache.update((collection) => ({
                ...collection,
                items: collection.items.map((current) => (current.id === item.id ? item : current)),
            })),
        onError: showError,
    });

    const remove = useMutation({
        mutationFn: (itemId: number) => collectionApi.deleteItem(collectionId, itemId),
        onSuccess: (_, itemId) => {
            cache.update((collection) => ({
                ...collection,
                items: collection.items
                    .filter((item) => item.id !== itemId)
                    .map((item, order) => ({ ...item, order })),
            }));
            cache.invalidateLists();
        },
        onError: showError,
    });

    const reorder = useMutation({
        mutationFn: (itemIds: number[]) => collectionApi.reorderItems(collectionId, itemIds),
        onMutate: (itemIds) => {
            const previous = cache.snapshot();

            cache.update((collection) => ({
                ...collection,
                items: itemIds
                    .map((id) => collection.items.find((item) => item.id === id))
                    .filter((item) => item !== undefined)
                    .map((item, order) => ({ ...item, order })),
            }));

            return { previous };
        },
        onError: async (error, _, context) => {
            cache.restore(context?.previous);
            await showError(error);
        },
    });

    return { add, update, remove, reorder };
}
