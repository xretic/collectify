import type { ThemeToken } from '@/shared/config/themes';

/** Message keys (`themeEditor.tokens.*`) for each theme color. */
export const TOKEN_KEYS = {
    'bg-color': 'background',
    'container-color': 'cards',
    'border-color': 'lines',
    'text-color': 'text',
    'soft-text': 'softText',
    'muted-icon': 'icons',
    accent: 'accent',
    'on-accent': 'onAccent',
    danger: 'danger',
    'on-danger': 'onDanger',
    favorite: 'favorite',
} as const satisfies Record<ThemeToken, string>;
