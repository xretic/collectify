import { z } from 'zod';
import {
    DESCRIPTION_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    FULLNAME_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    URL_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from '@/shared/lib/constants';

/** Shared by client forms and API routes, so both enforce the same rules. */

export const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters.`)
    .max(USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters.`)
    .regex(/^[a-z0-9_.]+$/, 'Username may contain only a-z, 0-9, "_" and ".".');

export const passwordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`)
    .regex(/^[a-zA-Z0-9!@#$%^&*()]+$/, 'Password contains unsupported characters.');

export const emailSchema = z.string().trim().toLowerCase().max(EMAIL_MAX_LENGTH).email();

export const fullNameSchema = z.string().trim().min(1).max(FULLNAME_MAX_LENGTH);

export const profileDescriptionSchema = z.string().trim().max(DESCRIPTION_MAX_LENGTH);

/** Only http(s) — blocks `javascript:`/`data:` URLs that would become stored XSS. */
export function isHttpUrl(value: string): boolean {
    if (value.length > URL_MAX_LENGTH) return false;

    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

export const httpUrlSchema = z.string().trim().refine(isHttpUrl, 'Must be a valid http(s) URL.');

/** Optional URL field: empty string / null / undefined all mean "no URL". */
export const optionalHttpUrlSchema = z
    .union([httpUrlSchema, z.literal(''), z.null()])
    .optional()
    .transform((value) => value || null);

export const isUsernameValid = (value: string) => usernameSchema.safeParse(value).success;
export const isPasswordValid = (value: string) => passwordSchema.safeParse(value).success;
