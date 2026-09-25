import { z } from 'zod';
import {
    birthDateSchema,
    citySchema,
    countrySchema,
    emailSchema,
    fullNameSchema,
    httpUrlSchema,
    localeSchema,
    passwordSchema,
    profileDescriptionSchema,
    usernameSchema,
} from '@/shared/lib/validation/schemas';

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'validation.required').max(200, 'validation.tooLong'),
});

export const registerSchema = z.object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    locale: localeSchema.optional(),
});

export const updateProfileSchema = z
    .object({
        username: usernameSchema,
        fullName: fullNameSchema,
        description: profileDescriptionSchema,
        avatarUrl: z.union([httpUrlSchema, z.literal('')]),
        bannerUrl: z.union([httpUrlSchema, z.literal('')]),
        country: countrySchema,
        city: citySchema,
        birthDate: birthDateSchema,
    })
    .partial()
    .strict();

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().max(200).optional(),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
        message: 'validation.passwordsMismatch',
        path: ['confirmPassword'],
    });

/** Password for password accounts, username for OAuth-only accounts. */
export const deleteAccountSchema = z.object({
    confirmation: z.string().min(1, 'validation.required').max(200, 'validation.tooLong'),
});

export const setLocaleSchema = z.object({ locale: localeSchema });
