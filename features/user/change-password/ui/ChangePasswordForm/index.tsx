'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, TextField } from '@mui/material';
import { userApi } from '@/entities/user/api/userApi';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { PASSWORD_MAX_LENGTH } from '@/shared/lib/constants';
import { passwordSchema } from '@/shared/lib/validation/schemas';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';

const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
    const { setUser } = useSessionUser();
    const [form, setForm] = useState(empty);

    const set = (key: keyof typeof empty, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const newPasswordCheck = passwordSchema.safeParse(form.newPassword);
    const mismatch = form.confirmPassword !== '' && form.confirmPassword !== form.newPassword;
    const valid =
        newPasswordCheck.success &&
        !mismatch &&
        form.confirmPassword !== '' &&
        (!hasPassword || form.currentPassword);

    const save = useMutation({
        mutationFn: () =>
            userApi.changePassword({
                currentPassword: hasPassword ? form.currentPassword : undefined,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword,
            }),
        onSuccess: (user) => {
            setUser(user);
            setForm(empty);
            toast.success(
                hasPassword ? 'Password changed.' : 'Password set. You can now sign in with email.',
            );
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const inputProps = {
        htmlInput: { maxLength: PASSWORD_MAX_LENGTH, autoComplete: 'new-password' },
    };

    return (
        <form
            className={styles.form}
            onSubmit={(event) => {
                event.preventDefault();
                if (valid) save.mutate();
            }}
        >
            {hasPassword && (
                <TextField
                    type="password"
                    label="Current password"
                    value={form.currentPassword}
                    onChange={(event) => set('currentPassword', event.target.value)}
                    slotProps={{ htmlInput: { autoComplete: 'current-password' } }}
                    size="small"
                />
            )}

            <TextField
                type="password"
                label="New password"
                value={form.newPassword}
                onChange={(event) => set('newPassword', event.target.value)}
                error={form.newPassword !== '' && !newPasswordCheck.success}
                helperText={
                    form.newPassword !== '' && !newPasswordCheck.success
                        ? newPasswordCheck.error.issues[0]?.message
                        : undefined
                }
                slotProps={inputProps}
                size="small"
            />

            <TextField
                type="password"
                label="Confirm new password"
                value={form.confirmPassword}
                onChange={(event) => set('confirmPassword', event.target.value)}
                error={mismatch}
                helperText={mismatch ? 'Passwords do not match.' : undefined}
                slotProps={inputProps}
                size="small"
            />

            <div>
                <Button type="submit" variant="contained" disabled={!valid || save.isPending}>
                    {hasPassword ? 'Change password' : 'Set password'}
                </Button>
            </div>
        </form>
    );
}
