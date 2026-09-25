import { create } from 'zustand';
import { DEFAULT_THEME, isThemeId, THEMES, type ThemeId } from '@/shared/config/themes';

export const THEME_STORAGE_KEY = 'theme';

type ThemeState = {
    theme: ThemeId;
    setTheme: (theme: ThemeId) => void;
};

function readInitialTheme(): ThemeId {
    if (typeof document === 'undefined') return DEFAULT_THEME;
    const current = document.documentElement.dataset.theme;
    return isThemeId(current) ? current : DEFAULT_THEME;
}

/**
 * The attribute is set before first paint by the inline script in the root
 * layout, so the store only mirrors it (no flash, no hydration mismatch).
 */
export const useThemeStore = create<ThemeState>((set) => ({
    theme: readInitialTheme(),
    setTheme: (theme) => {
        document.documentElement.dataset.theme = theme;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Storage can be unavailable (private mode); the theme still applies.
        }

        set({ theme });
    },
}));

const THEME_IDS = JSON.stringify(THEMES.map((theme) => theme.id));

/** Runs before hydration; must stay dependency-free. Unknown ids fall back to the default. */
export const themeInitScript = `(function(){var d='${DEFAULT_THEME}';try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=${THEME_IDS}.indexOf(t)>=0?t:d;}catch(e){document.documentElement.dataset.theme=d;}})();`;
