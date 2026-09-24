'use client';

import { useState } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { managementApi } from '@/entities/moderation/api/managementApi';
import {
    SANCTION_DURATION_LABELS,
    SANCTION_DURATIONS,
    SANCTION_SCOPE_LABELS,
    SANCTION_SCOPES,
    type SanctionDuration,
    type SanctionScope,
} from '@/entities/sanction/model/types';
import { MODERATION_NOTE_MAX_LENGTH } from '@/shared/lib/constants';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useModerationMutation } from '@/entities/moderation/model/useModerationMutation';
import styles from './index.module.css';

type SanctionFormProps = {
    userId: number;
    username: string;
    isAdmin: boolean;
};

export function SanctionForm({ userId, username, isAdmin }: SanctionFormProps) {
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
        (result) =>
            result.applied
                ? 'Sanction applied.'
                : 'A stronger sanction is already active; it was kept.',
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
                <InputLabel id="sanction-scope">Scope</InputLabel>
                <Select
                    labelId="sanction-scope"
                    label="Scope"
                    value={scope}
                    onChange={(event) => setScope(event.target.value as SanctionScope)}
                >
                    {SANCTION_SCOPES.map((value) => (
                        <MenuItem key={value} value={value}>
                            {SANCTION_SCOPE_LABELS[value]}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" className={styles.select}>
                <InputLabel id="sanction-duration">Duration</InputLabel>
                <Select
                    labelId="sanction-duration"
                    label="Duration"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value as SanctionDuration)}
                >
                    {SANCTION_DURATIONS.map((value) => (
                        <MenuItem
                            key={value}
                            value={value}
                            disabled={value === 'permanent' && !isAdmin}
                        >
                            {SANCTION_DURATION_LABELS[value]}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Reason"
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
                Apply
            </Button>

            <ConfirmDialog
                open={confirming}
                title={`Sanction @${username}?`}
                description={
                    scope &&
                    `${SANCTION_SCOPE_LABELS[scope]} for ${SANCTION_DURATION_LABELS[duration].toLowerCase()}.${
                        reason ? ` Reason: ${reason}` : ''
                    }`
                }
                confirmLabel="Apply sanction"
                destructive
                pending={issue.isPending}
                onClose={() => setConfirming(false)}
                onConfirm={submit}
            />
        </div>
    );
}
