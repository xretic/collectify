'use client';

import { ReactNode, useEffect } from 'react';
import { useTheme } from '@/shared/lib/hooks/useTheme';

type Props = { children: ReactNode };

export default function ThemeProvider({ children }: Props) {
    const { theme } = useTheme();

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    return <>{children}</>;
}
