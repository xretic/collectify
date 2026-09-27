'use client';

import { Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { promptSignIn } from '@/features/auth/model/authPromptStore';
import { useResumeIntent } from '@/features/auth/model/useResumeIntent';
import { useFollowUser } from '../../model/useFollowUser';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type FollowButtonProps = {
    userId: number;
    isFollowed: boolean;
    /** Guests are asked to sign in; the follow happens once they are back. */
    guest?: boolean;
    /** Keeps a view that is not in the user caches (e.g. a collection's author) in sync. */
    onChange?: (followed: boolean) => void;
    size?: 'small' | 'medium';
    /** `onImage`: readable over a photo (the collection hero). */
    tone?: 'default' | 'onImage';
};

/** Labeled Follow / Following button, like on every social network. */
export function FollowButton({
    userId,
    isFollowed,
    guest = false,
    onChange,
    size = 'medium',
    tone = 'default',
}: FollowButtonProps) {
    const t = useTranslations('profile.follows');
    const mutation = useFollowUser();

    const setFollowed = (follow: boolean) => {
        onChange?.(follow);
        mutation.mutate({ userId, follow }, { onError: () => onChange?.(!follow) });
    };

    const intent = { kind: 'follow', id: userId } as const;
    useResumeIntent(intent, !guest && !isFollowed, () => setFollowed(true));

    const onClick = () => {
        if (guest) promptSignIn('follow', intent);
        else setFollowed(!isFollowed);
    };

    return (
        <Button
            variant={isFollowed ? 'outlined' : 'contained'}
            size={size}
            className={`${styles.button} ${tone === 'onImage' ? styles.onImage : ''}`}
            onClick={onClick}
            disabled={mutation.isPending}
            aria-pressed={isFollowed}
            startIcon={isFollowed ? <CheckIcon /> : <PersonAddAlt1Icon />}
        >
            {isFollowed ? t('followingButton') : t('follow')}
        </Button>
    );
}
