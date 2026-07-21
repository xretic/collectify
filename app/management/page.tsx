import ManagementPage from '@/views/management/ui/ManagementPage';
import { Suspense } from 'react';

export default function ManagementRoute() {
    return (
        <Suspense fallback={null}>
            <ManagementPage />
        </Suspense>
    );
}
