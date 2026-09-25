'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField } from '@mui/material';
import { authApi } from '@/entities/auth/api/authApi';
import { PASSWORD_MAX_LENGTH, USERNAME_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { registerSchema } from '../../model/schemas';
import { useAuthSuccess } from '../../model/useAuthSuccess';
import styles from '../authForm.module.css';

type RegisterValues = { email: string; username: string; password: string };

export function RegisterForm() {
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
            onSubmit={handleSubmit((values) => signUp.mutate(values))}
            noValidate
        >
            <TextField
                {...register('email')}
                type="email"
                label="Email"
                autoComplete="email"
                error={Boolean(formState.errors.email)}
                helperText={formState.errors.email?.message}
                fullWidth
            />

            <TextField
                {...register('username')}
                label="Username"
                autoComplete="username"
                error={Boolean(formState.errors.username)}
                helperText={
                    formState.errors.username?.message ?? 'Lowercase letters, digits, "_" and "."'
                }
                slotProps={{ htmlInput: { maxLength: USERNAME_MAX_LENGTH } }}
                fullWidth
            />

            <TextField
                {...register('password')}
                type="password"
                label="Password"
                autoComplete="new-password"
                error={Boolean(formState.errors.password)}
                helperText={formState.errors.password?.message ?? 'At least 8 characters'}
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
                {signUp.isPending ? 'Creating account…' : 'Register'}
            </Button>
        </form>
    );
}
