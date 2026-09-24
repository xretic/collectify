'use client';

import { IconButton, Tooltip } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/entities/user/api/userApi';
import { userQueryKeys } from '@/entities/user/model/queryKeys';
import type { PublicUser } from '@/entities/user/model/types';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';

export function FollowButton({ user, disabled }: { user: PublicUser; disabled?: boolean }) {
    const queryClient = useQueryClient();
    const key = userQueryKeys.detail(user.id);

    const mutation = useMutation({
        mutationFn: (follow: boolean) =>
            follow ? userApi.follow(user.id) : userApi.unfollow(user.id),
        onMutate: async (follow) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<PublicUser>(key);

            queryClient.setQueryData<PublicUser>(
                key,
                (current) =>
                    current && {
                        ...current,
                        isFollowed: follow,
                        followers: Math.max(0, current.followers + (follow ? 1 : -1)),
                    },
            );

            return { previous };
        },
        onError: async (error, _, context) => {
            if (context?.previous) queryClient.setQueryData(key, context.previous);
            toast.error(await getApiErrorMessage(error));
        },
    });

    return (
        <Tooltip title={user.isFollowed ? 'Unfollow' : 'Follow'}>
            <span>
                <IconButton
                    color="inherit"
                    onClick={() => mutation.mutate(!user.isFollowed)}
                    disabled={disabled || mutation.isPending}
                    aria-pressed={user.isFollowed}
                    aria-label={user.isFollowed ? 'Unfollow' : 'Follow'}
                >
                    {user.isFollowed ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
                </IconButton>
            </span>
        </Tooltip>
    );
}
