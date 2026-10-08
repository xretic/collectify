'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, CircularProgress } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authApi } from '@/entities/auth/api/authApi';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { switchSessionUser } from '@/entities/user/model/switchSessionUser';
import { useUrlToken } from '@/features/auth/model/useUrlToken';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { EmailNotice } from '@/features/auth/ui/EmailNotice';
import { getApiErrorCode, getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { PasswordField } from '@/shared/ui/PasswordField';
import styles from './VerifyEmailPage.module.css';
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
    const t = useTranslations('auth.verify');
    const ta = useTranslations('auth');
    const tm = useTranslations('meta.pages');
    const te = useTranslations('errors');
    const token = useUrlToken();
    const { user, refresh } = useSessionUser();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(token ? null : te('linkInvalid'));
    // Opened in another browser than the sign-up: the account's password is asked too.
    const [needsPassword, setNeedsPassword] = useState(false);
    const [password, setPassword] = useState('');

    const {
        mutate: verify,
        isPending,
        isSuccess,
        data: signedIn,
    } = useMutation({
        mutationFn: authApi.verifyEmail,
        // The link signed this browser in (it finishes a sign-up): use that account.
        onSuccess: (account) => (account ? switchSessionUser(queryClient, account) : refresh()),
        onError: async (reason) => {
            if ((await getApiErrorCode(reason)) === 'confirmWithPassword') setNeedsPassword(true);
            // A wrong password: the form stays for another try.
            else if (needsPassword) toast.error(await getApiErrorMessage(reason));
            else setError(await getApiErrorMessage(reason));
        },
    });

    // Once only: the link is single-use (and Strict Mode runs effects twice).
    const started = useRef(false);
    useEffect(() => {
        if (!token || started.current) return;
        started.current = true;
        verify({ token });
    }, [token, verify]);

    // A second click on an old link still ends well when the address is confirmed.
    const confirmed = isSuccess || Boolean(error && user?.emailVerified);

    return (
        <AuthLayout title={tm('verifyEmail')} oauth={false}>
            {confirmed ? (
                <EmailNotice
                    icon={MarkEmailReadOutlinedIcon}
                    title={t('successTitle')}
                    actions={
                        user ? (
                            // A sign-up finished by the link continues with onboarding.
                            <Button
                                variant="contained"
                                component={Link}
                                href={signedIn ? '/onboarding' : '/'}
                            >
                                {t('continue')}
                            </Button>
                        ) : (
                            <Button variant="contained" component={Link} href="/auth/login">
                                {ta('login')}
                            </Button>
                        )
                    }
                >
                    {/* Opened in another browser than the sign-up: the password is still needed. */}
                    <p>{user ? t('success') : t('signInToContinue')}</p>
                </EmailNotice>
            ) : needsPassword && token ? (
                <EmailNotice icon={LockOutlinedIcon} title={t('passwordTitle')}>
                    <p>{t('passwordBody')}</p>
                    <form
                        className={styles.form}
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (password) verify({ token, password });
                        }}
                    >
                        <PasswordField
                            label={ta('password')}
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoFocus
                            fullWidth
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!password || isPending}
                            fullWidth
                        >
                            {t('passwordSubmit')}
                        </Button>
                    </form>
                </EmailNotice>
            ) : error ? (
                <EmailNotice
                    icon={LinkOffIcon}
                    tone="danger"
                    title={t('failedTitle')}
                    actions={
                        // Signing in with the password sends a new link.
                        !user && (
                            <Button variant="contained" component={Link} href="/auth/login">
                                {t('signInToResend')}
                            </Button>
                        )
                    }
                >
                    <p>{error}</p>
                </EmailNotice>
            ) : (
                <EmailNotice icon={MarkEmailReadOutlinedIcon} title={t('verifying')}>
                    <CircularProgress size={28} />
                </EmailNotice>
            )}
        </AuthLayout>
    );
}
