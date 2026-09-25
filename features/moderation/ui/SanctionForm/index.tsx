'use client';

import { useState } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { managementApi } from '@/entities/moderation/api/managementApi';
import {
    SANCTION_DURATIONS,
    SANCTION_SCOPES,
    type SanctionDuration,
    type SanctionScope,
} from '@/entities/sanction/model/types';
import { MODERATION_NOTE_MAX_LENGTH } from '@/shared/lib/constants';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type SanctionFormProps = {
    userId: number;
    username: string;
    isAdmin: boolean;
};

export function SanctionForm({ userId, username, isAdmin }: SanctionFormProps) {
    const t = useTranslations('management.sanctions');
    const ts = useTranslations('sanctions');
    const [scope, setScope] = useState<SanctionScope | ''>('');
    const [duration, setDuration] = useState<SanctionDuration>('1d');
    const [reason, setReason] = useState('');
    const [confirming, setConfirming] = useState(false);

    const issue = useModerationMutation(
        () =>
            managementApi.issueSanction(userId, {
                scope: scope as SanctionScope,
                duration,
                reason,
            }),
        (result) => (result.applied ? t('applied') : t('strongerKept')),
    );

    const submit = () =>
        issue.mutate(undefined, {
            onSuccess: () => {
                setConfirming(false);
                setScope('');
                setReason('');
            },
        });

    return (
        <div className={styles.form}>
            <FormControl size="small" className={styles.select}>
                <InputLabel id="sanction-scope">{t('scope')}</InputLabel>
                <Select
                    labelId="sanction-scope"
                    label={t('scope')}
                    value={scope}
                    onChange={(event) => setScope(event.target.value as SanctionScope)}
                >
                    {SANCTION_SCOPES.map((value) => (
                        <MenuItem key={value} value={value}>
                            {ts(`scopes.${value}`)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" className={styles.select}>
                <InputLabel id="sanction-duration">{t('duration')}</InputLabel>
                <Select
                    labelId="sanction-duration"
                    label={t('duration')}
                    value={duration}
                    onChange={(event) => setDuration(event.target.value as SanctionDuration)}
                >
                    {SANCTION_DURATIONS.map((value) => (
                        <MenuItem
                            key={value}
                            value={value}
                            disabled={value === 'permanent' && !isAdmin}
                        >
                            {ts(`durations.${value}`)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label={t('reason')}
                size="small"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                slotProps={{ htmlInput: { maxLength: MODERATION_NOTE_MAX_LENGTH } }}
                className={styles.reason}
            />

            <Button
                variant="contained"
                color="error"
                startIcon={<BlockOutlinedIcon />}
                disabled={!scope || issue.isPending}
                onClick={() => setConfirming(true)}
            >
                {t('apply')}
            </Button>

            <ConfirmDialog
                open={confirming}
                title={t('confirmTitle', { username })}
                description={
                    scope &&
                    [
                        t('summary', {
                            scope: ts(`scopes.${scope}`),
                            duration: ts(`durations.${duration}`),
                        }),
                        reason && t('reasonLine', { reason }),
                    ]
                        .filter(Boolean)
                        .join(' ')
                }
                confirmLabel={t('confirm')}
                destructive
                pending={issue.isPending}
                onClose={() => setConfirming(false)}
                onConfirm={submit}
            />
        </div>
    );
}
