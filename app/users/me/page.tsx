import type { Metadata } from 'next';
import { Suspense } from 'react';
import MyProfilePage from '@/views/my-profile/ui/MyProfilePage';

export const metadata: Metadata = { title: 'My profile' };

export default function MyProfileRoute() {
    return (
        <Suspense>
            <MyProfilePage />
        </Suspense>
    );
}
