import { z } from 'zod';
import {
    CATEGORIES,
    COLLECTION_DESCRIPTION_MAX_LENGTH,
    COLLECTION_NAME_MAX_LENGTH,
    ITEM_DESCRIPTION_MAX_LENGTH,
    ITEM_TITLE_MAX_LENGTH,
} from '@/shared/lib/constants';
import { httpUrlSchema, optionalHttpUrlSchema } from '@/shared/lib/validation/schemas';

export const itemSchema = z.object({
    title: z.string().trim().min(1, 'Title is required.').max(ITEM_TITLE_MAX_LENGTH),
    description: z
        .string()
        .trim()
        .min(1, 'Description is required.')
        .max(ITEM_DESCRIPTION_MAX_LENGTH),
    sourceUrl: optionalHttpUrlSchema,
    imageUrl: optionalHttpUrlSchema,
});

const collectionFields = {
    name: z.string().trim().min(1, 'Name is required.').max(COLLECTION_NAME_MAX_LENGTH),
    description: z
        .string()
        .trim()
        .min(1, 'Description is required.')
        .max(COLLECTION_DESCRIPTION_MAX_LENGTH),
    bannerUrl: httpUrlSchema,
    isPrivate: z.boolean(),
};

export const createCollectionSchema = z.object({
    ...collectionFields,
    category: z.enum(CATEGORIES),
    item: itemSchema,
});

export const updateCollectionSchema = z.object(collectionFields);
