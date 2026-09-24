import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getViewerFromCookies } from '@/features/auth/server/guards';
import { getUserRoles } from '@/entities/user/server/roles';
import { isStaff } from '@/entities/user/model/types';
import ManagementPage from '@/views/management/ui/ManagementPage';

export const metadata: Metadata = { title: 'Management', robots: { index: false } };

/** Server-side guard: non-staff get a 404 instead of an empty client page. */
export default async function ManagementRoute() {
    const viewer = await getViewerFromCookies();
    if (!viewer || !isStaff(await getUserRoles(viewer.userId))) notFound();

    return (
        <Suspense>
            <ManagementPage />
        </Suspense>
    );
}
