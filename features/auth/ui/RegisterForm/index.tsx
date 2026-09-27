'use client';

import { useForm, useWatch } from 'react-hook-form';
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
import { PasswordField } from '@/shared/ui/PasswordField';
import { registerSchema } from '../../model/schemas';
import { useAuthSuccess } from '../../model/useAuthSuccess';
import { suggestUsername } from '../../lib/suggestUsername';
import { withNext } from '@/shared/lib/safeNextPath';
import styles from '../authForm.module.css';
import { useLocale, useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

type RegisterValues = { email: string; username: string; password: string };

export function RegisterForm() {
    const t = useTranslations('auth');
    // The account keeps the language the visitor is browsing in (changeable in settings).
    const locale = useLocale();
    const validationMessage = useValidationMessage();
    const onSuccess = useAuthSuccess((next) => withNext('/onboarding', next));
    const { register, handleSubmit, formState, getValues, setValue, control } =
        useForm<RegisterValues>({
            resolver: zodResolver(registerSchema),
            defaultValues: { email: '', username: '', password: '' },
        });

    const signUp = useMutation({
        mutationFn: authApi.register,
        onSuccess,
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const username = useWatch({ control, name: 'username' });

    // One field less to think about: the username starts from the email.
    const email = register('email', {
        onBlur: (event) => {
            const suggestion = suggestUsername(event.target.value);
            if (suggestion && !getValues('username')) setValue('username', suggestion);
        },
    });

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit((values) => signUp.mutate({ ...values, locale }))}
            noValidate
        >
            <TextField
                {...email}
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
                slotProps={{
                    htmlInput: { maxLength: USERNAME_MAX_LENGTH },
                    // A suggested value is set without typing: keep the label out of its way.
                    inputLabel: { shrink: username ? true : undefined },
                }}
                fullWidth
            />

            <PasswordField
                {...register('password')}
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

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={signUp.isPending}
            >
                {signUp.isPending ? t('creatingAccount') : t('createAccount')}
            </Button>
        </form>
    );
}
