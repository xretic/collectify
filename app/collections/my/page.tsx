import type { Metadata } from 'next';
import { Suspense } from 'react';
import MyCollectionsPage from '@/views/my-collections/ui/MyCollectionsPage';

export const metadata: Metadata = { title: 'My collections' };

export default function MyCollectionsRoute() {
    return (
        <Suspense>
            <MyCollectionsPage />
        </Suspense>
    );
}
