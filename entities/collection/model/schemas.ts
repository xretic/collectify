import { z } from 'zod';
import {
    COLLECTION_DESCRIPTION_MAX_LENGTH,
    COLLECTION_NAME_MAX_LENGTH,
    COLLECTION_TAGS_LIMIT,
    ITEM_DESCRIPTION_MAX_LENGTH,
    ITEM_SIZES,
    ITEM_TITLE_MAX_LENGTH,
} from '@/shared/lib/constants';
import { httpUrlSchema, optionalHttpUrlSchema } from '@/shared/lib/validation/schemas';
import { idSchema } from '@/shared/lib/validation/ids';

/** An item needs a title or an image; the description is always optional. */
export const itemSchema = z
    .object({
        title: z.string().trim().max(ITEM_TITLE_MAX_LENGTH, 'validation.tooLong').default(''),
        description: z
            .string()
            .trim()
            .max(ITEM_DESCRIPTION_MAX_LENGTH, 'validation.tooLong')
            .default(''),
        sourceUrl: optionalHttpUrlSchema,
        imageUrl: optionalHttpUrlSchema,
        size: z.enum(ITEM_SIZES).default('M'),
    })
    .refine((item) => item.title !== '' || item.imageUrl !== null, {
        path: ['title'],
        message: 'validation.itemTitleOrImage',
    });

const collectionFields = {
    name: z
        .string()
        .trim()
        .min(1, 'validation.nameRequired')
        .max(COLLECTION_NAME_MAX_LENGTH, 'validation.tooLong'),
    description: z
        .string()
        .trim()
        .min(1, 'validation.descriptionRequired')
        .max(COLLECTION_DESCRIPTION_MAX_LENGTH, 'validation.tooLong'),
    categoryId: z.number().int().positive('validation.categoryRequired'),
    tagIds: z.array(idSchema).max(COLLECTION_TAGS_LIMIT, 'validation.tagsMax').default([]),
    bannerUrl: httpUrlSchema,
    isPrivate: z.boolean(),
};

export const createCollectionSchema = z.object({
    ...collectionFields,
    item: itemSchema,
});

export const updateCollectionSchema = z.object(collectionFields);
