import { Suspense } from 'react';
import VerifyEmailPage from '@/views/verify-email/ui/VerifyEmailPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('verifyEmail');

export default function VerifyEmailRoute() {
    return (
        <Suspense>
            <VerifyEmailPage />
        </Suspense>
    );
}
