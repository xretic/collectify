'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@mui/material';
import { authApi } from '@/entities/auth/api/authApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { PasswordField } from '@/shared/ui/PasswordField';
import { newPasswordSchema } from '../../model/schemas';
import { useAuthSuccess } from '../../model/useAuthSuccess';
import styles from '../authForm.module.css';
import { useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

type NewPasswordValues = { password: string; confirmPassword: string };

/** New password from an emailed reset link; signs in on success. */
export function ResetPasswordForm({ token }: { token: string }) {
    const t = useTranslations('auth.reset');
    const validationMessage = useValidationMessage();
    const onSignedIn = useAuthSuccess('/');
    const { register, handleSubmit, formState } = useForm<NewPasswordValues>({
        resolver: zodResolver(newPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const reset = useMutation({
        mutationFn: (values: NewPasswordValues) => authApi.resetPassword({ ...values, token }),
        onSuccess: (user) => {
            toast.success(t('done'));
            onSignedIn(user);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit((values) => reset.mutate(values))}
            noValidate
        >
            <PasswordField
                {...register('password')}
                label={t('password')}
                autoComplete="new-password"
                autoFocus
                error={Boolean(formState.errors.password)}
                helperText={validationMessage(formState.errors.password?.message)}
                fullWidth
            />

            <PasswordField
                {...register('confirmPassword')}
                label={t('confirmPassword')}
                autoComplete="new-password"
                error={Boolean(formState.errors.confirmPassword)}
                helperText={validationMessage(formState.errors.confirmPassword?.message)}
                fullWidth
            />

            <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={reset.isPending}
            >
                {reset.isPending ? t('saving') : t('submit')}
            </Button>
        </form>
    );
}
