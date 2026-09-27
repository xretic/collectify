'use client';

import Link from 'next/link';
import { Button } from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useUrlToken } from '@/features/auth/model/useUrlToken';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { EmailNotice } from '@/features/auth/ui/EmailNotice';
import { ResetPasswordForm } from '@/features/auth/ui/ResetPasswordForm';
import { useTranslations } from 'next-intl';

export default function ResetPasswordPage() {
    const t = useTranslations('auth');
    const token = useUrlToken();

    return (
        <AuthLayout
            title={t('reset.title')}
            subtitle={token ? t('reset.subtitle') : undefined}
            oauth={false}
            footer={<Link href="/auth/login">{t('forgot.backToLogin')}</Link>}
        >
            {token ? (
                <ResetPasswordForm token={token} />
            ) : (
                <EmailNotice
                    icon={LinkOffIcon}
                    tone="danger"
                    title={t('verify.failedTitle')}
                    actions={
                        <Button variant="contained" component={Link} href="/auth/forgot-password">
                            {t('reset.requestNew')}
                        </Button>
                    }
                >
                    <p>{t('reset.missingToken')}</p>
                </EmailNotice>
            )}
        </AuthLayout>
    );
}
