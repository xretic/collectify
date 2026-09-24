import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPublicUser } from '@/entities/user/server/profile';
import UserProfilePage from '@/views/user-profile/ui/UserProfilePage';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const userId = Number((await params).id);
    const user = Number.isInteger(userId) && userId > 0 ? await getPublicUser(userId, null) : null;

    if (!user) return { title: 'User not found' };

    return {
        title: `${user.fullName} (@${user.username})`,
        description: user.description || `${user.fullName}'s collections on Collectify.`,
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
