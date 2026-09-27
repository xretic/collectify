'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@mui/material';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { useLeaveIfSignedIn } from '@/features/auth/model/useLeaveIfSignedIn';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { useTranslations } from 'next-intl';
import { safeNextPath, withNext } from '@/shared/lib/safeNextPath';

const OAUTH_ERRORS = {
    'oauth-state': 'oauthState',
    'oauth-failed': 'oauthFailed',
    'account-banned': 'accountBanned',
} as const;

const isOAuthError = (value: string | null): value is keyof typeof OAUTH_ERRORS =>
    value !== null && value in OAUTH_ERRORS;

export default function LoginPage() {
    const t = useTranslations('auth');
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const next = safeNextPath(searchParams.get('next'));

    useLeaveIfSignedIn(next);

    return (
        <AuthLayout
            title={t('login')}
            subtitle={t('loginSubtitle')}
            footer={t.rich('noAccount', {
                link: (chunks) => <Link href={withNext('/auth/register', next)}>{chunks}</Link>,
            })}
        >
            {isOAuthError(error) && (
                <Alert severity="error">{t(`oauthErrors.${OAUTH_ERRORS[error]}`)}</Alert>
            )}
            <LoginForm />
        </AuthLayout>
    );
}
