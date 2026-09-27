'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Button, CircularProgress } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { authApi } from '@/entities/auth/api/authApi';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { useUrlToken } from '@/features/auth/model/useUrlToken';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { EmailNotice } from '@/features/auth/ui/EmailNotice';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
    const t = useTranslations('auth.verify');
    const tm = useTranslations('meta.pages');
    const te = useTranslations('errors');
    const token = useUrlToken();
    const { user, refresh } = useSessionUser();
    const [error, setError] = useState<string | null>(token ? null : te('linkInvalid'));

    const { mutate: verify, isSuccess } = useMutation({
        mutationFn: authApi.verifyEmail,
        onSuccess: () => refresh(),
        onError: async (reason) => setError(await getApiErrorMessage(reason)),
    });

    const resend = useMutation({
        mutationFn: authApi.resendVerification,
        onSuccess: () => user?.email && toast.success(t('sent', { email: user.email })),
        onError: async (reason) => toast.error(await getApiErrorMessage(reason)),
    });

    // Once only: the link is single-use (and Strict Mode runs effects twice).
    const started = useRef(false);
    useEffect(() => {
        if (!token || started.current) return;
        started.current = true;
        verify(token);
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
                        <Button variant="contained" component={Link} href="/">
                            {t('continue')}
                        </Button>
                    }
                >
                    <p>{t('success')}</p>
                </EmailNotice>
            ) : error ? (
                <EmailNotice
                    icon={LinkOffIcon}
                    tone="danger"
                    title={t('failedTitle')}
                    actions={
                        user?.email ? (
                            <Button
                                variant="contained"
                                onClick={() => resend.mutate()}
                                disabled={resend.isPending || resend.isSuccess}
                            >
                                {t('resend')}
                            </Button>
                        ) : (
                            !user && (
                                <Button variant="contained" component={Link} href="/auth/login">
                                    {t('signInToResend')}
                                </Button>
                            )
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
