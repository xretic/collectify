'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { reportApi } from '@/entities/report/api/reportApi';
import { REPORT_REASONS, type ReportReason } from '@/entities/report/model/types';
import { REPORT_DETAILS_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { useReportDialogStore, type ReportRequest } from '../../model/reportDialogStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Mounted once in the root layout; opened through `useReportDialogStore`. */
export function ReportDialog() {
    const request = useReportDialogStore((state) => state.request);
    const close = useReportDialogStore((state) => state.close);

    // Keyed by target so every report starts with a fresh form.
    return request ? (
        <ReportForm key={JSON.stringify(request.target)} request={request} onClose={close} />
    ) : null;
}

function ReportForm({ request, onClose }: { request: ReportRequest; onClose: () => void }) {
    const t = useTranslations('reports');
    const tc = useTranslations('common');
    const [reason, setReason] = useState<ReportReason | ''>('');
    const [details, setDetails] = useState('');

    const submit = useMutation({
        mutationFn: () =>
            reportApi.create({ target: request.target, reason: reason as ReportReason, details }),
        onSuccess: () => {
            toast.success(t('submitted'));
            onClose();
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const handleClose = () => {
        if (!submit.isPending) onClose();
    };

    return (
        <Dialog open onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{t(`reportTarget.${request.target.type}`)}</DialogTitle>

            <DialogContent className={styles.content}>
                <div className={styles.target}>
                    <span className={styles.username}>@{request.username}</span>
                    {request.preview && (
                        <blockquote className={styles.quote}>{request.preview}</blockquote>
                    )}
                </div>

                <FormControl size="small" fullWidth required>
                    <InputLabel id="report-reason">{t('reason')}</InputLabel>
                    <Select
                        labelId="report-reason"
                        label={t('reason')}
                        value={reason}
                        onChange={(event) => setReason(event.target.value as ReportReason)}
                    >
                        {REPORT_REASONS.map((value) => (
                            <MenuItem key={value} value={value}>
                                {t(`reasons.${value}`)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <CountedTextField
                    label={t('details')}
                    value={details}
                    onChange={setDetails}
                    maxLength={REPORT_DETAILS_MAX_LENGTH}
                    multiline
                    minRows={3}
                    fullWidth
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={submit.isPending}>
                    {tc('cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={() => submit.mutate()}
                    disabled={!reason || submit.isPending}
                >
                    {t('submit')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
