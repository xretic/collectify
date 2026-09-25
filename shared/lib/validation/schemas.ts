import { z } from 'zod';
import { isCountryCode } from '@/shared/lib/geo/countries';
import {
    CITY_MAX_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    MAX_USER_AGE,
    MIN_USER_AGE,
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

/** Optional country: ISO code, `null`/'' clears it. */
export const countrySchema = z
    .union([
        z.string().trim().toUpperCase().refine(isCountryCode, 'Unknown country.'),
        z.literal(''),
        z.null(),
    ])
    .transform((value) => value || null);

/** Optional city: free text, `null`/'' clears it. */
export const citySchema = z
    .union([
        z
            .string()
            .transform((value) => value.trim().replace(/\s+/g, ' '))
            .pipe(
                z
                    .string()
                    .max(CITY_MAX_LENGTH)
                    .regex(
                        /^[\p{L}\p{M}\p{N} .,'‘’ʼ`/()-]*$/u,
                        "Use letters, spaces and - . , ' / ( )",
                    ),
            ),
        z.null(),
    ])
    .transform((value) => value || null);

/** Age in full years on `today` (UTC calendar dates). */
export function ageOn(birthDate: string, today = new Date()): number {
    const [year, month, day] = birthDate.split('-').map(Number);
    const hadBirthday =
        today.getUTCMonth() + 1 > month ||
        (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);

    return today.getUTCFullYear() - year - (hadBirthday ? 0 : 1);
}

/** Optional `YYYY-MM-DD` birth date; the user must be at least 18. */
export const birthDateSchema = z
    .union([
        z.iso
            .date('Enter a valid date.')
            .refine(
                (value) => ageOn(value) >= MIN_USER_AGE,
                `You must be at least ${MIN_USER_AGE}.`,
            )
            .refine((value) => ageOn(value) <= MAX_USER_AGE, 'Enter a valid date.'),
        z.literal(''),
        z.null(),
    ])
    .transform((value) => value || null);

export const isUsernameValid = (value: string) => usernameSchema.safeParse(value).success;
export const isPasswordValid = (value: string) => passwordSchema.safeParse(value).success;
