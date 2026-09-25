import { Suspense } from 'react';
import MyCollectionsPage from '@/views/my-collections/ui/MyCollectionsPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('myCollections');

export default function MyCollectionsRoute() {
    return (
        <Suspense>
            <MyCollectionsPage />
        </Suspense>
    );
}
