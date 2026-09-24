import { itemSchema, updateCollectionSchema } from './schemas';
import type { CollectionDetails, CollectionItemPayload, UpdateCollectionPayload } from './types';

/** Form state of the collection / item editors (strings, not yet validated). */
export type CollectionDraft = {
    name: string;
    description: string;
    bannerUrl: string;
    isPrivate: boolean;
};

export const emptyCollectionDraft: CollectionDraft = {
    name: '',
    description: '',
    bannerUrl: '',
    isPrivate: false,
};

export const toCollectionDraft = (collection: CollectionDetails): CollectionDraft => ({
    name: collection.name,
    description: collection.description,
    bannerUrl: collection.bannerUrl,
    isPrivate: collection.isPrivate,
});

export function toCollectionPayload(draft: CollectionDraft): UpdateCollectionPayload | null {
    const result = updateCollectionSchema.safeParse(draft);
    return result.success ? result.data : null;
}

export type ItemDraft = {
    title: string;
    description: string;
    sourceUrl: string;
    imageUrl: string;
};

export const emptyItemDraft: ItemDraft = {
    title: '',
    description: '',
    sourceUrl: '',
    imageUrl: '',
};

export function toItemDraft(item: Partial<CollectionItemPayload>): ItemDraft {
    return {
        title: item.title ?? '',
        description: item.description ?? '',
        sourceUrl: item.sourceUrl ?? '',
        imageUrl: item.imageUrl ?? '',
    };
}

/** Parses a draft with the same schema the API uses; `null` when invalid. */
export function toItemPayload(draft: ItemDraft): CollectionItemPayload | null {
    const result = itemSchema.safeParse(draft);
    return result.success ? result.data : null;
}

export function isSourceUrlInvalid(draft: ItemDraft) {
    return (
        draft.sourceUrl.trim() !== '' &&
        !itemSchema.shape.sourceUrl.safeParse(draft.sourceUrl).success
    );
}
