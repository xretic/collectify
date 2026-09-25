'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
    const t = useTranslations('auth');
    const router = useRouter();
    const { user } = useSessionUser();

    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    return (
        <AuthLayout
            title={t('register')}
            subtitle={t('registerSubtitle')}
            footer={t.rich('haveAccount', {
                link: (chunks) => <Link href="/auth/login">{chunks}</Link>,
            })}
        >
            <RegisterForm />
        </AuthLayout>
    );
}
