import { z } from 'zod';
import { isCountryCode } from '@/shared/lib/geo/countries';
import { LOCALES } from '@/shared/config/i18n';
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
    .min(USERNAME_MIN_LENGTH, 'validation.usernameMin')
    .max(USERNAME_MAX_LENGTH, 'validation.usernameMax')
    .regex(/^[a-z0-9_.]+$/, 'validation.usernameChars');

export const passwordSchema = z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'validation.passwordMin')
    .max(PASSWORD_MAX_LENGTH, 'validation.passwordMax')
    .regex(/^[a-zA-Z0-9!@#$%^&*()]+$/, 'validation.passwordChars');

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .max(EMAIL_MAX_LENGTH, 'validation.tooLong')
    .email('validation.emailInvalid');

export const fullNameSchema = z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(FULLNAME_MAX_LENGTH, 'validation.tooLong');

export const profileDescriptionSchema = z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, 'validation.tooLong');

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

export const httpUrlSchema = z.string().trim().refine(isHttpUrl, 'validation.urlInvalid');

/** Optional URL field: empty string / null / undefined all mean "no URL". */
export const optionalHttpUrlSchema = z
    .union([httpUrlSchema, z.literal(''), z.null()])
    .optional()
    .transform((value) => value || null);

/** Optional country: ISO code, `null`/'' clears it. */
export const countrySchema = z
    .union([
        z.string().trim().toUpperCase().refine(isCountryCode, 'validation.countryUnknown'),
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
                    .max(CITY_MAX_LENGTH, 'validation.tooLong')
                    .regex(/^[\p{L}\p{M}\p{N} .,'‘’ʼ`/()-]*$/u, 'validation.cityChars'),
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
            .date('validation.dateInvalid')
            .refine((value) => ageOn(value) >= MIN_USER_AGE, 'validation.ageMin')
            .refine((value) => ageOn(value) <= MAX_USER_AGE, 'validation.dateInvalid'),
        z.literal(''),
        z.null(),
    ])
    .transform((value) => value || null);

export const localeSchema = z.enum(LOCALES, 'validation.localeUnknown');
