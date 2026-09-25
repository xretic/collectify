'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { userApi } from '@/entities/user/api/userApi';
import type { SessionUser } from '@/entities/user/model/types';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export function DeleteAccountButton({ user }: { user: SessionUser }) {
    const t = useTranslations('settings.danger');
    const tc = useTranslations('common');
    const router = useRouter();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');

    const remove = useMutation({
        mutationFn: () => userApi.deleteAccount(confirmation),
        onSuccess: () => {
            queryClient.clear();
            queryClient.setQueryData(sessionUserQueryKey, null);
            router.replace('/');
        },
        onError: async (err) => setError(await getApiErrorMessage(err)),
    });

    const close = () => {
        if (remove.isPending) return;
        setOpen(false);
        setConfirmation('');
        setError('');
    };

    return (
        <>
            <Button variant="contained" color="error" onClick={() => setOpen(true)}>
                {t('deleteAccount')}
            </Button>

            <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
                <DialogTitle className={styles.title}>
                    <WarningAmberOutlinedIcon color="error" />
                    {t('deleteAccount')}
                </DialogTitle>

                <DialogContent className={styles.content}>
                    <DialogContentText color="inherit">{t('warning')}</DialogContentText>

                    <TextField
                        autoFocus
                        type={user.hasPassword ? 'password' : 'text'}
                        label={
                            user.hasPassword
                                ? t('yourPassword')
                                : t('typeUsername', { username: user.username })
                        }
                        value={confirmation}
                        onChange={(event) => {
                            setConfirmation(event.target.value);
                            setError('');
                        }}
                        error={Boolean(error)}
                        helperText={error || undefined}
                        fullWidth
                        size="small"
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={close} disabled={remove.isPending}>
                        {tc('cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => remove.mutate()}
                        disabled={!confirmation || remove.isPending}
                    >
                        {t('deleteForever')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
