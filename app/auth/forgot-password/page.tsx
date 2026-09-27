import { Suspense } from 'react';
import ForgotPasswordPage from '@/views/forgot-password/ui/ForgotPasswordPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('forgotPassword');

export default function ForgotPasswordRoute() {
    return (
        <Suspense>
            <ForgotPasswordPage />
        </Suspense>
    );
}
