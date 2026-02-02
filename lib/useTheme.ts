import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved) {
            setTheme(saved);
            document.documentElement.dataset.theme = saved;
        }
    }, []);

    const changeTheme = (next: Theme) => {
        setTheme(next);
        localStorage.setItem('theme', next);
        document.documentElement.dataset.theme = next;
    };

    return { theme, changeTheme };
}
