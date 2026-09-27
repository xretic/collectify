import { Suspense } from 'react';
import ResetPasswordPage from '@/views/reset-password/ui/ResetPasswordPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('resetPassword');

export default function ResetPasswordRoute() {
    return (
        <Suspense>
            <ResetPasswordPage />
        </Suspense>
    );
}
