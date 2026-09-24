import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

type ThemeState = {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
};

function readInitialMode(): ThemeMode {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * The attribute is set before first paint by the inline script in the root
 * layout, so the store only mirrors it (no flash, no hydration mismatch).
 */
export const useThemeStore = create<ThemeState>((set) => ({
    mode: readInitialMode(),
    setMode: (mode) => {
        document.documentElement.dataset.theme = mode;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch {
            // Storage can be unavailable (private mode); the theme still applies.
        }

        set({ mode });
    },
}));

/** Runs before hydration; must stay dependency-free. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;
