'use client';

import { IconButton, Tooltip } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import type { PublicUser } from '@/entities/user/model/types';
import { useFollowUser } from '../../model/useFollowUser';
import { useTranslations } from 'next-intl';

export function FollowButton({ user, disabled }: { user: PublicUser; disabled?: boolean }) {
    const t = useTranslations('profile');
    const mutation = useFollowUser();

    return (
        <Tooltip title={user.isFollowed ? t('unfollow') : t('follow')}>
            <span>
                <IconButton
                    color="inherit"
                    onClick={() => mutation.mutate({ userId: user.id, follow: !user.isFollowed })}
                    disabled={disabled || mutation.isPending}
                    aria-pressed={user.isFollowed}
                    aria-label={user.isFollowed ? t('unfollow') : t('follow')}
                >
                    {user.isFollowed ? <FavoriteIcon /> : <FavoriteBorderOutlinedIcon />}
                </IconButton>
            </span>
        </Tooltip>
    );
}
