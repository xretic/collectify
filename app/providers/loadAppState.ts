import 'server-only';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { categoryQueryKeys } from '@/entities/category/model/queryKeys';
import { listActiveCategories } from '@/entities/category/server/queries';
import { sessionUserQueryKey } from '@/entities/user/model/queryKeys';
import { getSessionUser } from '@/entities/user/server/profile';
import { getCookieViewer } from '@/features/auth/server/guards';

/**
 * What every page needs on first paint (the signed-in user and the category
 * list), read on the server so the browser does not ask the API for it.
 * `staleSession`: the cookie outlived its session, the client drops it.
 */
export async function loadAppState() {
    const queryClient = new QueryClient();
    const { viewer, stale } = await getCookieViewer();

    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: sessionUserQueryKey,
            queryFn: () =>
                viewer ? getSessionUser(viewer.userId, viewer.session.impersonatorUserId) : null,
        }),
        queryClient.prefetchQuery({
            queryKey: categoryQueryKeys.active(),
            queryFn: listActiveCategories,
        }),
    ]);

    return { state: dehydrate(queryClient), staleSession: stale };
}
