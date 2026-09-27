'use client';

import Link from 'next/link';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/ui/ForgotPasswordForm';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
    const t = useTranslations('auth.forgot');

    return (
        <AuthLayout
            title={t('title')}
            subtitle={t('subtitle')}
            oauth={false}
            footer={<Link href="/auth/login">{t('backToLogin')}</Link>}
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
}
