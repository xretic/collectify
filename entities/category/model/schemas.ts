import { z } from 'zod';
import { CATEGORY_DESCRIPTION_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH } from '@/shared/lib/constants';

export const categorySlugSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required.')
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and dashes.');

export const categorySchema = z.object({
    name: z.string().trim().min(1, 'Name is required.').max(CATEGORY_NAME_MAX_LENGTH),
    slug: categorySlugSchema,
    description: z.string().trim().max(CATEGORY_DESCRIPTION_MAX_LENGTH).default(''),
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
