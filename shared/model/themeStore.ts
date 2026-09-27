import { create } from 'zustand';
import {
    CUSTOM_THEME_PREFIX,
    DEFAULT_THEME,
    isThemeId,
    THEME_TOKENS,
    THEMES,
    type ActiveThemeId,
    type CustomTheme,
} from '@/shared/config/themes';
import { parseCustomThemes } from '@/shared/lib/validation/theme';

export const THEME_STORAGE_KEY = 'theme';
export const CUSTOM_THEMES_STORAGE_KEY = 'collectify:custom-themes';

type ThemeState = {
    theme: ActiveThemeId;
    customThemes: CustomTheme[];
    setTheme: (theme: ActiveThemeId) => void;
    /** Adds or replaces the theme and switches to it. */
    saveCustomTheme: (theme: CustomTheme) => void;
    deleteCustomTheme: (id: CustomTheme['id']) => void;
};

function readCustomThemes(): CustomTheme[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        return parseCustomThemes(
            JSON.parse(localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY) ?? '[]'),
        );
    } catch {
        return [];
    }
}

function writeStorage(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode); the theme still applies.
    }
}

function readInitialTheme(customThemes: CustomTheme[]): ActiveThemeId {
    if (typeof document === 'undefined') return DEFAULT_THEME;
    const current = document.documentElement.dataset.theme;
    if (isThemeId(current)) return current;
    return customThemes.find((theme) => theme.id === current)?.id ?? DEFAULT_THEME;
}

/**
 * Presets are `[data-theme]` blocks in app/themes.css. A custom theme has no
 * block, so its tokens go inline on <html> and override the `:root` defaults.
 */
function applyTheme(id: ActiveThemeId, customThemes: CustomTheme[]) {
    const root = document.documentElement;
    const custom = customThemes.find((theme) => theme.id === id);

    for (const token of THEME_TOKENS) {
        if (custom) root.style.setProperty(`--${token}`, custom.colors[token]);
        else root.style.removeProperty(`--${token}`);
    }
    root.style.colorScheme = custom?.scheme ?? '';
    root.dataset.theme = id;
}

const initialCustomThemes = readCustomThemes();

/**
 * The attribute (and a custom theme's tokens) are set before first paint by the
 * inline script in the root layout, so the store only mirrors them.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: readInitialTheme(initialCustomThemes),
    customThemes: initialCustomThemes,
    setTheme: (theme) => {
        applyTheme(theme, get().customThemes);
        writeStorage(THEME_STORAGE_KEY, theme);
        set({ theme });
    },
    saveCustomTheme: (theme) => {
        const current = get().customThemes;
        const customThemes = current.some((item) => item.id === theme.id)
            ? current.map((item) => (item.id === theme.id ? theme : item))
            : [theme, ...current];

        writeStorage(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
        set({ customThemes });
        get().setTheme(theme.id);
    },
    deleteCustomTheme: (id) => {
        const removed = get().customThemes.find((item) => item.id === id);
        const customThemes = get().customThemes.filter((item) => item.id !== id);

        writeStorage(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(customThemes));
        set({ customThemes });
        // Deleting the theme in use falls back to the plain preset of the same brightness.
        if (removed && get().theme === id) get().setTheme(removed.scheme);
    },
}));

const THEME_IDS = JSON.stringify(THEMES.map((theme) => theme.id));
const TOKENS = JSON.stringify(THEME_TOKENS);

/**
 * Runs before hydration; must stay dependency-free. Unknown ids and broken
 * custom themes fall back to the default. Mirrors `applyTheme` and `customThemeSchema`.
 */
export const themeInitScript = `(function(){var d='${DEFAULT_THEME}',r=document.documentElement,t=null;try{t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t&&t.indexOf('${CUSTOM_THEME_PREFIX}')===0){var l=JSON.parse(localStorage.getItem('${CUSTOM_THEMES_STORAGE_KEY}')||'[]'),k=${TOKENS};for(var i=0;i<l.length;i++){var c=l[i];if(!c||c.id!==t||!c.colors||(c.scheme!=='light'&&c.scheme!=='dark'))continue;if(!k.every(function(n){return /^#[0-9a-f]{6}$/i.test(c.colors[n]);}))break;k.forEach(function(n){r.style.setProperty('--'+n,c.colors[n]);});r.style.colorScheme=c.scheme;r.dataset.theme=t;return;}}}catch(e){}r.dataset.theme=${THEME_IDS}.indexOf(t)>=0?t:d;})();`;
