import { Suspense } from 'react';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import MyProfilePage from '@/views/my-profile/ui/MyProfilePage';
import { boardQueryKeys } from '@/entities/board/model/queryKeys';
import { listBoards } from '@/entities/board/server/queries';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { listCollections } from '@/entities/collection/server/queries';
import { getViewerFromCookies } from '@/features/auth/server/guards';
import { profileListParams } from '@/widgets/profile-collections/lib/listParams';
import { pageMetadata } from '@/shared/i18n/metadata';

type Query = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Query> };

export const generateMetadata = pageMetadata('myProfile');

/** The viewer's collections (current tab) and boards are loaded on the server with the page. */
export default async function MyProfileRoute({ searchParams }: Props) {
    const queryClient = new QueryClient();
    const viewer = await getViewerFromCookies();

    if (viewer) {
        const query = await searchParams;
        const { tab, params } = profileListParams(
            (key) => {
                const value = query[key];
                return Array.isArray(value) ? value[0] : value;
            },
            viewer.userId,
            true,
        );

        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: collectionQueryKeys.list(params),
                queryFn: () => listCollections(params, viewer.userId),
            }),
            // The favorites tab shows the board picker.
            tab === 'favorites' &&
                queryClient.prefetchQuery({
                    queryKey: boardQueryKeys.mine(),
                    queryFn: () => listBoards(viewer.userId),
                }),
        ]);
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense>
                <MyProfilePage />
            </Suspense>
        </HydrationBoundary>
    );
}
