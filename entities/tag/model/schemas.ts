import { z } from 'zod';
import { TAG_NAME_MAX_LENGTH, TAG_NAME_MIN_LENGTH } from '@/shared/lib/constants';
import { idSchema } from '@/shared/lib/validation/ids';

/** "  Sci‑Fi   Classics " → "sci-fi classics": the key that makes tags unique per category. */
export function normalizeTagName(name: string) {
    return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export const tagNameSchema = z
    .string()
    .transform((value) => value.normalize('NFKC').trim().replace(/\s+/g, ' '))
    .pipe(
        z
            .string()
            .min(TAG_NAME_MIN_LENGTH, 'validation.tagNameMin')
            .max(TAG_NAME_MAX_LENGTH, 'validation.tooLong')
            .regex(/^[\p{L}\p{N}][\p{L}\p{N} &+.'#-]*$/u, 'validation.tagNameChars'),
    );

export const createTagSchema = z.object({
    categoryId: idSchema,
    name: tagNameSchema,
});

export const tagSearchSchema = z.object({
    /** Omitted: search every category. */
    categoryId: idSchema.optional(),
    query: z.string().trim().max(TAG_NAME_MAX_LENGTH).default(''),
});
