import { Suspense } from 'react';
import RegisterPage from '@/views/register/ui/RegisterPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('register');

export default function RegisterRoute() {
    return (
        <Suspense>
            <RegisterPage />
        </Suspense>
    );
}
