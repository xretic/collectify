import { z } from 'zod';
import {
    CUSTOM_THEME_NAME_MAX_LENGTH,
    CUSTOM_THEME_PREFIX,
    isThemeId,
    MAX_CUSTOM_THEMES,
    THEME_TOKENS,
    type ActiveThemeId,
    type CustomTheme,
} from '@/shared/config/themes';

const hexSchema = z.string().regex(/^#[0-9a-f]{6}$/i);

export const customThemeSchema = z.object({
    id: z
        .string()
        .regex(new RegExp(`^${CUSTOM_THEME_PREFIX}[a-z0-9]{1,32}$`))
        .transform((id) => id as CustomTheme['id']),
    name: z.string().trim().min(1).max(CUSTOM_THEME_NAME_MAX_LENGTH),
    scheme: z.enum(['light', 'dark']),
    // An enum-keyed record requires every token.
    colors: z.record(z.enum(THEME_TOKENS), hexSchema),
    manual: z.array(z.enum(THEME_TOKENS)).max(THEME_TOKENS.length).optional(),
}) satisfies z.ZodType<CustomTheme, unknown>;

/** What the account keeps: the theme in use and the themes the user made. */
export const appearanceSchema = z
    .object({
        theme: z.string().max(64),
        customThemes: z.array(customThemeSchema).max(MAX_CUSTOM_THEMES),
    })
    .refine(
        ({ theme, customThemes }) =>
            isThemeId(theme) || customThemes.some((item) => item.id === theme),
        { path: ['theme'] },
    )
    .transform((value) => ({ ...value, theme: value.theme as ActiveThemeId }));

export type Appearance = z.infer<typeof appearanceSchema>;

/** Stored JSON back to themes, dropping anything that no longer validates. */
export function parseCustomThemes(value: unknown): CustomTheme[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        const parsed = customThemeSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
    });
}
