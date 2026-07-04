'use client';

import { Loader } from '@/shared/ui/Loader';
import { useUIStore } from '@/shared/model/uiStore';

export const GlobalLoader = () => {
    const isLoading = useUIStore((s) => s.loadingCount > 0);

    if (!isLoading) return null;

    return <Loader />;
};
