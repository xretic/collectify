'use client';

import { Alert, Snackbar } from '@mui/material';
import { useToastStore } from '@/shared/model/toastStore';

/** Renders the latest toast. Mounted once in the root layout. */
export function Toaster() {
    const current = useToastStore((state) => state.current);
    const dismiss = useToastStore((state) => state.dismiss);

    return (
        <Snackbar
            key={current?.id}
            open={current !== null}
            autoHideDuration={5000}
            onClose={(_, reason) => reason !== 'clickaway' && dismiss()}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert severity={current?.severity ?? 'info'} variant="filled" onClose={dismiss}>
                {current?.message}
            </Alert>
        </Snackbar>
    );
}
