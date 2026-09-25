'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@mui/material';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { useTranslations } from 'next-intl';

const OAUTH_ERRORS = {
    'oauth-state': 'oauthState',
    'oauth-failed': 'oauthFailed',
    'account-banned': 'accountBanned',
} as const;

const isOAuthError = (value: string | null): value is keyof typeof OAUTH_ERRORS =>
    value !== null && value in OAUTH_ERRORS;

export default function LoginPage() {
    const t = useTranslations('auth');
    const router = useRouter();
    const { user } = useSessionUser();
    const error = useSearchParams().get('error');

    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    return (
        <AuthLayout
            title={t('login')}
            subtitle={t('loginSubtitle')}
            footer={t.rich('noAccount', {
                link: (chunks) => <Link href="/auth/register">{chunks}</Link>,
            })}
        >
            {isOAuthError(error) && (
                <Alert severity="error">{t(`oauthErrors.${OAUTH_ERRORS[error]}`)}</Alert>
            )}
            <LoginForm />
        </AuthLayout>
    );
}
