'use client';

import { Loader } from '@/components/ui/Loader';
import { useUIStore } from '@/stores/uiStore';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export const GlobalLoader = () => {
    const isLoading = useUIStore((s) => s.loadingCount > 0);

    if (!isLoading) return null;

    return <Loader />;
};
