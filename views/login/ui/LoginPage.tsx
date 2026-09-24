'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@mui/material';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { LoginForm } from '@/features/auth/ui/LoginForm';

const OAUTH_ERRORS: Record<string, string> = {
    'oauth-state': 'The sign-in link expired. Please try again.',
    'oauth-failed': 'Sign-in with the provider failed. Please try again.',
    'account-banned': 'This account is banned.',
};

export default function LoginPage() {
    const router = useRouter();
    const { user } = useSessionUser();
    const error = useSearchParams().get('error');

    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    return (
        <AuthLayout
            title="Login"
            subtitle="Enter your credentials to access your account."
            footer={
                <>
                    No account yet? <Link href="/auth/register">Register</Link>
                </>
            }
        >
            {error && OAUTH_ERRORS[error] && <Alert severity="error">{OAUTH_ERRORS[error]}</Alert>}
            <LoginForm />
        </AuthLayout>
    );
}
