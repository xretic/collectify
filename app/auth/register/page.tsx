import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterPage from '@/views/register/ui/RegisterPage';

export const metadata: Metadata = { title: 'Register' };

export default function RegisterRoute() {
    return (
        <Suspense>
            <RegisterPage />
        </Suspense>
    );
}
