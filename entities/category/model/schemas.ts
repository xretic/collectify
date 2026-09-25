import { z } from 'zod';
import { CATEGORY_DESCRIPTION_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH } from '@/shared/lib/constants';

export const categorySlugSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'validation.slugRequired')
    .max(40, 'validation.tooLong')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'validation.slugChars');

export const categorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'validation.nameRequired')
        .max(CATEGORY_NAME_MAX_LENGTH, 'validation.tooLong'),
    slug: categorySlugSchema,
    description: z
        .string()
        .trim()
        .max(CATEGORY_DESCRIPTION_MAX_LENGTH, 'validation.tooLong')
        .default(''),
    position: z.number().int().min(0).max(10_000).default(0),
    isActive: z.boolean().default(true),
});

/** "Home & Interior" → "home-interior". */
export function slugify(value: string) {
    return value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
}
