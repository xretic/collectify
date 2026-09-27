'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField } from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { authApi } from '@/entities/auth/api/authApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { PASSWORD_RESET_TTL_HOURS } from '@/shared/lib/constants';
import { forgotPasswordSchema } from '../../model/schemas';
import { EmailNotice } from '../EmailNotice';
import styles from '../authForm.module.css';
import { useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

export function ForgotPasswordForm() {
    const t = useTranslations('auth.forgot');
    const ta = useTranslations('auth');
    const validationMessage = useValidationMessage();
    const [sentTo, setSentTo] = useState<string | null>(null);
    const { register, handleSubmit, formState } = useForm<{ email: string }>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const send = useMutation({
        mutationFn: authApi.forgotPassword,
        onSuccess: (_, email) => setSentTo(email),
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    if (sentTo) {
        return (
            <EmailNotice icon={MarkEmailReadOutlinedIcon} title={t('sentTitle')}>
                <p>
                    {t.rich('sent', {
                        email: sentTo,
                        hours: PASSWORD_RESET_TTL_HOURS,
                        strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                </p>
                <p>
                    {t.rich('notReceived', {
                        link: (chunks) => (
                            <button type="button" onClick={() => setSentTo(null)}>
                                {chunks}
                            </button>
                        ),
                    })}
                </p>
            </EmailNotice>
        );
    }

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit(({ email }) => send.mutate(email))}
            noValidate
        >
            <TextField
                {...register('email')}
                type="email"
                label={ta('email')}
                autoComplete="email"
                autoFocus
                error={Boolean(formState.errors.email)}
                helperText={validationMessage(formState.errors.email?.message)}
                fullWidth
            />

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={send.isPending}
            >
                {send.isPending ? t('sending') : t('submit')}
            </Button>
        </form>
    );
}
