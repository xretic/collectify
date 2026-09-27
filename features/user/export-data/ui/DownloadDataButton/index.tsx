'use client';

import { useMutation } from '@tanstack/react-query';
import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useTranslations } from 'next-intl';
import { userApi } from '@/entities/user/api/userApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

/** Fetches the export with a POST and hands the JSON file to the browser to save. */
export function DownloadDataButton() {
    const t = useTranslations('settings.data');

    const download = useMutation({
        mutationFn: userApi.exportData,
        onSuccess: ({ blob, filename }) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            // Revoked a moment later: some browsers start reading the file after the click.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <Button
            variant="outlined"
            onClick={() => download.mutate()}
            disabled={download.isPending}
            startIcon={<DownloadIcon />}
        >
            {t('download')}
        </Button>
    );
}
