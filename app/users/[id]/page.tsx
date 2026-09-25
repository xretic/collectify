import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { getPublicUser } from '@/entities/user/server/profile';
import UserProfilePage from '@/views/user-profile/ui/UserProfilePage';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const userId = Number((await params).id);
    const user = Number.isInteger(userId) && userId > 0 ? await getPublicUser(userId, null) : null;

    const t = await getTranslations('meta');
    if (!user) return { title: t('pages.userNotFound') };

    return {
        title: `${user.fullName} (@${user.username})`,
        description: user.description || t('userDescription', { name: user.fullName }),
        openGraph: { images: user.avatarUrl ? [user.avatarUrl] : undefined },
    };
}

export default function UserProfileRoute() {
    return (
        <Suspense>
            <UserProfilePage />
        </Suspense>
    );
}
