'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField } from '@mui/material';
import { authApi } from '@/entities/auth/api/authApi';
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
} from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { registerSchema } from '../../model/schemas';
import { useAuthSuccess } from '../../model/useAuthSuccess';
import styles from '../authForm.module.css';
import { useLocale, useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';
import { LanguageSelect } from '@/features/locale/ui/LanguageSelect';

type RegisterValues = { email: string; username: string; password: string };

export function RegisterForm() {
    const t = useTranslations('auth');
    const locale = useLocale();
    const validationMessage = useValidationMessage();
    const onSuccess = useAuthSuccess('/onboarding');
    const { register, handleSubmit, formState } = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: '', username: '', password: '' },
    });

    const signUp = useMutation({
        mutationFn: authApi.register,
        onSuccess,
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit((values) => signUp.mutate({ ...values, locale }))}
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
                {...register('username')}
                label={t('username')}
                autoComplete="username"
                error={Boolean(formState.errors.username)}
                helperText={
                    validationMessage(formState.errors.username?.message) ?? t('usernameHint')
                }
                slotProps={{ htmlInput: { maxLength: USERNAME_MAX_LENGTH } }}
                fullWidth
            />

            <TextField
                {...register('password')}
                type="password"
                label={t('password')}
                autoComplete="new-password"
                error={Boolean(formState.errors.password)}
                helperText={
                    validationMessage(formState.errors.password?.message) ??
                    t('passwordHint', { min: PASSWORD_MIN_LENGTH })
                }
                slotProps={{ htmlInput: { maxLength: PASSWORD_MAX_LENGTH } }}
                fullWidth
            />

            <LanguageSelect fullWidth helperText={t('languageHint')} />

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={signUp.isPending}
            >
                {signUp.isPending ? t('creatingAccount') : t('register')}
            </Button>
        </form>
    );
}
