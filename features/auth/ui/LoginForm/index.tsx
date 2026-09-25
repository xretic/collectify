'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField } from '@mui/material';
import { authApi } from '@/entities/auth/api/authApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { loginSchema } from '../../model/schemas';
import { useAuthSuccess } from '../../model/useAuthSuccess';
import styles from '../authForm.module.css';
import { useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

type LoginValues = { email: string; password: string };

export function LoginForm() {
    const t = useTranslations('auth');
    const validationMessage = useValidationMessage();
    const onSuccess = useAuthSuccess();
    const { register, handleSubmit, formState } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const login = useMutation({
        mutationFn: authApi.login,
        onSuccess,
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

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

            <TextField
                {...register('password')}
                type="password"
                label={t('password')}
                autoComplete="current-password"
                error={Boolean(formState.errors.password)}
                helperText={validationMessage(formState.errors.password?.message)}
                fullWidth
            />

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
