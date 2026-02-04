'use client';

import { useUIStore } from '@/stores/uiStore';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export const GlobalLoader = () => {
    const isLoading = useUIStore((s) => s.loadingCount > 0);

    if (!isLoading) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.3)',
                zIndex: 1300,
            }}
        >
            <CircularProgress size={48} />
        </Box>
    );
};
