import { Suspense } from 'react';
import MyProfilePage from '@/views/my-profile/ui/MyProfilePage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('myProfile');

export default function MyProfileRoute() {
    return (
        <Suspense>
            <MyProfilePage />
        </Suspense>
    );
}
