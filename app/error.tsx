'use client';

import { Button } from '@mui/material';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useTranslations } from 'next-intl';

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
    const t = useTranslations('errorPage');
    const tc = useTranslations('common');

    return (
        <EmptyState
            title={t('title')}
            description={t('description')}
            action={
                <Button variant="contained" onClick={reset}>
                    {tc('retry')}
                </Button>
            }
        />
    );
}
