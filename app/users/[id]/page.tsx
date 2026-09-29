import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { getPublicUser } from '@/entities/user/server/profile';
import { NO_INDEX, socialMetadata, truncate } from '@/shared/i18n/metadata';
import { siteUrl } from '@/shared/server/env';
import { JsonLd } from '@/shared/ui/JsonLd';
import { profileStructuredData } from '@/entities/user/lib/structuredData';
import type { PublicUser } from '@/entities/user/model/types';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import UserProfilePage from '@/views/user-profile/ui/UserProfilePage';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { listCollections } from '@/entities/collection/server/queries';
import { profileListParams } from '@/widgets/profile-collections/lib/listParams';
import { getViewerFromCookies } from '@/features/auth/server/guards';

type Query = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ id: string }>; searchParams: Promise<Query> };

const readParam = (query: Query) => (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const userId = Number((await params).id);
    const user = Number.isInteger(userId) && userId > 0 ? await getPublicUser(userId, null) : null;

    const t = await getTranslations('meta');
    if (!user) return { title: t('pages.userNotFound'), robots: NO_INDEX };

    const title = `${user.fullName} (@${user.username})`;
    const intro = t('userDescription', { name: user.fullName, username: user.username });
    const description = truncate(user.description ? `${user.description} - ${intro}` : intro);

    return {
        title,
        description,
        ...(await socialMetadata({
            title,
            description,
            path: `/users/${userId}`,
            type: 'profile',
            username: user.username,
        })),
    };
}

/** The profile is rendered on the server with its data (search engines, first paint). */
export default async function UserProfileRoute({ params, searchParams }: Props) {
    const userId = Number((await params).id);
    const queryClient = new QueryClient();
    let user: PublicUser | null = null;

    if (Number.isInteger(userId) && userId > 0) {
        const viewer = await getViewerFromCookies();
        user = await getPublicUser(userId, viewer?.userId ?? null);
        if (user) {
            queryClient.setQueryData(userQueryKeys.detail(userId), user);

            // The first page of the profile's collections, so the grid is in the HTML.
            const { params: list } = profileListParams(
                readParam(await searchParams),
                userId,
                false,
            );
            await queryClient.prefetchQuery({
                queryKey: collectionQueryKeys.list(list),
                queryFn: () => listCollections(list, viewer?.userId ?? null),
            });
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {user && <JsonLd data={profileStructuredData(siteUrl(), user)} />}
            <Suspense>
                <UserProfilePage />
            </Suspense>
        </HydrationBoundary>
    );
}
