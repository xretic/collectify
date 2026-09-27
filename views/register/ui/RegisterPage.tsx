'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { useLeaveIfSignedIn } from '@/features/auth/model/useLeaveIfSignedIn';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';
import { useTranslations } from 'next-intl';
import { safeNextPath, withNext } from '@/shared/lib/safeNextPath';

export default function RegisterPage() {
    const t = useTranslations('auth');
    const next = safeNextPath(useSearchParams().get('next'));

    useLeaveIfSignedIn(next);

    return (
        <AuthLayout
            title={t('registerTitle')}
            subtitle={t('registerSubtitle')}
            footer={t.rich('haveAccount', {
                link: (chunks) => <Link href={withNext('/auth/login', next)}>{chunks}</Link>,
            })}
        >
            <RegisterForm />
        </AuthLayout>
    );
}
