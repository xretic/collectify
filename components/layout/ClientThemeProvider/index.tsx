'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';

type Props = { children: ReactNode };

export default function ClientThemeProvider({ children }: Props) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.documentElement.dataset.theme = theme;
    }, [theme]);

    if (!mounted) return null;

    return <>{children}</>;
}
