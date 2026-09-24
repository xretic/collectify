import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginPage from '@/views/login/ui/LoginPage';

export const metadata: Metadata = { title: 'Login' };

export default function LoginRoute() {
    return (
        <Suspense>
            <LoginPage />
        </Suspense>
    );
}
