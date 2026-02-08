import { Box, CircularProgress } from '@mui/material';

export function Loader() {
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
}
