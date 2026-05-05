import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'light';

        const saved = window.localStorage.getItem('theme');
        return saved === 'dark' || saved === 'light' ? saved : 'light';
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    const changeTheme = (next: Theme) => {
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.dataset.theme = next;
    };

    return { theme, changeTheme };
}
