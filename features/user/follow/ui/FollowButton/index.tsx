'use client';

import { IconButton, Tooltip } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import type { PublicUser } from '@/entities/user/model/types';
import { useFollowUser } from '../../model/useFollowUser';

export function FollowButton({ user, disabled }: { user: PublicUser; disabled?: boolean }) {
    const mutation = useFollowUser();

    return (
        <Tooltip title={user.isFollowed ? 'Unfollow' : 'Follow'}>
            <span>
                <IconButton
                    color="inherit"
                    onClick={() => mutation.mutate({ userId: user.id, follow: !user.isFollowed })}
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
