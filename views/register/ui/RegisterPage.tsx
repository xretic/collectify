'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { AuthLayout } from '@/features/auth/ui/AuthLayout';
import { RegisterForm } from '@/features/auth/ui/RegisterForm';

export default function RegisterPage() {
    const router = useRouter();
    const { user } = useSessionUser();

    useEffect(() => {
        if (user) router.replace('/');
    }, [user, router]);

    return (
        <AuthLayout
            title="Register"
            subtitle="Create an account to start collecting."
            footer={
                <>
                    Already have an account? <Link href="/auth/login">Login</Link>
                </>
            }
        >
            <RegisterForm />
        </AuthLayout>
    );
}
