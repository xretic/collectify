import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { userQueryKeys } from './queryKeys';
import type { FollowListPage, PublicUser, SuggestionsPage } from './types';

type RowsPage = { data: { id: number; isFollowed: boolean }[] };

function patchRows<P extends RowsPage>(page: P, userId: number, isFollowed: boolean): P {
    return {
        ...page,
        data: page.data.map((row) => (row.id === userId ? { ...row, isFollowed } : row)),
    };
}

/**
 * Writes the viewer's follow state of `userId` into every cached view of that
 * user (profile, followers/following lists, "People you may know"), so a
 * follow made in one place is reflected everywhere without a refetch.
 */
export function setFollowedInCache(queryClient: QueryClient, userId: number, isFollowed: boolean) {
    queryClient.setQueryData<PublicUser>(userQueryKeys.detail(userId), (user) =>
        user && user.isFollowed !== isFollowed
            ? {
                  ...user,
                  isFollowed,
                  followers: Math.max(0, user.followers + (isFollowed ? 1 : -1)),
              }
            : user,
    );

    queryClient.setQueriesData<InfiniteData<FollowListPage>>(
        { queryKey: userQueryKeys.allFollows() },
        (data) =>
            data && {
                ...data,
                pages: data.pages.map((page) => patchRows(page, userId, isFollowed)),
            },
    );

    // The widget caches a single page, the "see all" dialog an infinite list.
    queryClient.setQueriesData<SuggestionsPage | InfiniteData<SuggestionsPage>>(
        { queryKey: userQueryKeys.allSuggestions() },
        (data) => {
            if (!data) return data;
            if ('pages' in data) {
                return {
                    ...data,
                    pages: data.pages.map((page) => patchRows(page, userId, isFollowed)),
                };
            }
            return patchRows(data, userId, isFollowed);
        },
    );
}
