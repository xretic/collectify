'use client';

import { Button } from '@mui/material';
import { EmptyState } from '@/shared/ui/EmptyState';

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
    return (
        <EmptyState
            title="Something went wrong"
            description="Please try again."
            action={
                <Button variant="contained" onClick={reset}>
                    Try again
                </Button>
            }
        />
    );
}
