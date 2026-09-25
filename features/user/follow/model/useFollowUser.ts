'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/entities/user/api/userApi';
import { setFollowedInCache } from '@/entities/user/model/followCache';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import { sessionUserQueryKey } from '@/entities/user/model/useSessionUser';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

type FollowVariables = { userId: number; follow: boolean };

/**
 * The one follow / unfollow mutation of the app. It updates every cached view
 * of the user optimistically (and rolls back on error), so the profile, follow
 * lists and "People you may know" never disagree.
 */
export function useFollowUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, follow }: FollowVariables) =>
            follow ? userApi.follow(userId) : userApi.unfollow(userId),
        onMutate: async ({ userId, follow }) => {
            // A profile refetch in flight would overwrite the optimistic state.
            await queryClient.cancelQueries({ queryKey: userQueryKeys.detail(userId) });
            setFollowedInCache(queryClient, userId, follow);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionUserQueryKey }),
        onError: async (error, { userId, follow }) => {
            setFollowedInCache(queryClient, userId, !follow);
            toast.error(await getApiErrorMessage(error));
        },
    });
}
