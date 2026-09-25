import { Suspense } from 'react';
import LoginPage from '@/views/login/ui/LoginPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('login');

export default function LoginRoute() {
    return (
        <Suspense>
            <LoginPage />
        </Suspense>
    );
}
