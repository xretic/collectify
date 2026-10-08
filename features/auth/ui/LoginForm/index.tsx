'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField } from '@mui/material';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import { authApi } from '@/entities/auth/api/authApi';
import { getApiErrorCode, getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { PasswordField } from '@/shared/ui/PasswordField';
import { loginSchema } from '../../model/schemas';
import { useAuthSuccess } from '../../model/useAuthSuccess';
import { EmailNotice } from '../EmailNotice';
import styles from '../authForm.module.css';
import { useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

type LoginValues = { email: string; password: string };

export function LoginForm() {
    const t = useTranslations('auth');
    const validationMessage = useValidationMessage();
    const onSuccess = useAuthSuccess();
    /** An unconfirmed address that tried to sign in; `wait`: no new mail could be sent now. */
    const [unconfirmed, setUnconfirmed] = useState<{ email: string; wait: boolean } | null>(null);
    const { register, handleSubmit, formState } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const login = useMutation({
        mutationFn: authApi.login,
        onSuccess,
        onError: async (error, { email }) => {
            // The address is not confirmed yet: the emailed link finishes it.
            const code = await getApiErrorCode(error);
            if (code === 'emailNotVerified' || code === 'emailNotVerifiedWait') {
                setUnconfirmed({ email, wait: code === 'emailNotVerifiedWait' });
            } else {
                toast.error(await getApiErrorMessage(error));
            }
        },
    });

    if (unconfirmed) {
        return (
            <EmailNotice
                icon={MarkEmailUnreadOutlinedIcon}
                title={t('loginUnconfirmed.title')}
                actions={
                    <Button variant="outlined" onClick={() => setUnconfirmed(null)}>
                        {t('loginUnconfirmed.back')}
                    </Button>
                }
            >
                <p>
                    {t.rich(
                        unconfirmed.wait ? 'loginUnconfirmed.bodyWait' : 'loginUnconfirmed.body',
                        {
                            email: unconfirmed.email,
                            strong: (chunks) => <strong>{chunks}</strong>,
                        },
                    )}
                </p>
                <p>{t('loginUnconfirmed.hint')}</p>
            </EmailNotice>
        );
    }

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit((values) => login.mutate(values))}
            noValidate
        >
            <TextField
                {...register('email')}
                type="email"
                label={t('email')}
                autoComplete="email"
                error={Boolean(formState.errors.email)}
                helperText={validationMessage(formState.errors.email?.message)}
                fullWidth
            />

            <PasswordField
                {...register('password')}
                label={t('password')}
                autoComplete="current-password"
                error={Boolean(formState.errors.password)}
                helperText={validationMessage(formState.errors.password?.message)}
                fullWidth
            />

            <Link href="/auth/forgot-password" className={styles.aside}>
                {t('forgotPassword')}
            </Link>

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={login.isPending}
            >
                {login.isPending ? t('signingIn') : t('login')}
            </Button>
        </form>
    );
}
