import { itemSchema, updateCollectionSchema } from './schemas';
import type { TagRef } from '@/entities/tag/model/types';
import { optionalHttpUrlSchema } from '@/shared/lib/validation/schemas';
import type {
    CollectionDetails,
    CollectionItemPayload,
    ItemSize,
    UpdateCollectionPayload,
} from './types';

/** Form state of the collection / item editors (strings, not yet validated). */
export type CollectionDraft = {
    name: string;
    description: string;
    categoryId: number | null;
    tags: TagRef[];
    bannerUrl: string;
    isPrivate: boolean;
};

export const emptyCollectionDraft: CollectionDraft = {
    name: '',
    description: '',
    categoryId: null,
    tags: [],
    bannerUrl: '',
    isPrivate: false,
};

export const toCollectionDraft = (collection: CollectionDetails): CollectionDraft => ({
    name: collection.name,
    description: collection.description,
    categoryId: collection.category.id,
    tags: collection.tags,
    bannerUrl: collection.bannerUrl,
    isPrivate: collection.isPrivate,
});

export function toCollectionPayload(draft: CollectionDraft): UpdateCollectionPayload | null {
    const result = updateCollectionSchema.safeParse({
        ...draft,
        tagIds: draft.tags.map((tag) => tag.id),
    });
    return result.success ? result.data : null;
}

export type ItemDraft = {
    title: string;
    description: string;
    sourceUrl: string;
    imageUrl: string;
    size: ItemSize;
};

export const emptyItemDraft: ItemDraft = {
    title: '',
    description: '',
    sourceUrl: '',
    imageUrl: '',
    size: 'M',
};

export function toItemDraft(item: Partial<CollectionItemPayload>): ItemDraft {
    return {
        title: item.title ?? '',
        description: item.description ?? '',
        sourceUrl: item.sourceUrl ?? '',
        imageUrl: item.imageUrl ?? '',
        size: item.size ?? 'M',
    };
}

/** Parses a draft with the same schema the API uses; `null` when invalid. */
export function toItemPayload(draft: ItemDraft): CollectionItemPayload | null {
    const result = itemSchema.safeParse(draft);
    return result.success ? result.data : null;
}

export function isSourceUrlInvalid(draft: ItemDraft) {
    return (
        draft.sourceUrl.trim() !== '' && !optionalHttpUrlSchema.safeParse(draft.sourceUrl).success
    );
}
