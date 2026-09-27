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

export const forgotPasswordSchema = z.object({ email: emailSchema });

const newPasswordFields = { password: passwordSchema, confirmPassword: z.string() };
const passwordsMatch = {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
};

/** The form on the reset page (the token comes from the link). */
export const newPasswordSchema = z
    .object(newPasswordFields)
    .refine((value) => value.password === value.confirmPassword, passwordsMatch);

const emailTokenSchema = z.string().min(1, 'validation.required').max(200, 'validation.tooLong');

export const resetPasswordSchema = z
    .object({ ...newPasswordFields, token: emailTokenSchema })
    .refine((value) => value.password === value.confirmPassword, passwordsMatch);

export const verifyEmailSchema = z.object({ token: emailTokenSchema });

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
