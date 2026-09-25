'use client';

import type { ReactNode } from 'react';
import Avatar from '@mui/material/Avatar';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { countryName } from '@/shared/lib/geo/countries';
import { UserBadges } from '@/shared/ui/UserBadge';
import { toast } from '@/shared/model/toastStore';
import type { UserRole } from '../../model/types';
import styles from './index.module.css';

export type ProfileHeaderUser = {
    username: string;
    fullName: string;
    description: string;
    avatarUrl: string;
    bannerUrl: string;
    roles: UserRole[];
    country: string | null;
    city: string | null;
};

type ProfileHeaderProps = {
    user: ProfileHeaderUser;
    /** Buttons shown in the card's top-right corner. */
    actions?: ReactNode;
    /** Follow stats; shown inside the card on phones only (desktop shows them in the filter row). */
    stats?: ReactNode;
};

export function ProfileHeader({ user, actions, stats }: ProfileHeaderProps) {
    const location = [user.city, user.country && countryName(user.country)]
        .filter(Boolean)
        .join(', ');

    const copyUsername = async () => {
        try {
            await navigator.clipboard.writeText(user.username);
            toast.success('Username copied.');
        } catch {
            toast.error('Could not copy the username.');
        }
    };

    return (
        <header>
            {user.bannerUrl ? (
                <img className={styles.cover} src={user.bannerUrl} alt="" />
            ) : (
                <div className={`${styles.cover} ${styles.coverEmpty}`} />
            )}

            <div className={styles.card}>
                {actions && <div className={styles.actions}>{actions}</div>}

                <div className={styles.identity}>
                    <Avatar className={styles.avatar} src={user.avatarUrl} alt={user.username} />

                    <div className={styles.info}>
                        <div className={styles.head}>
                            <h1 className={styles.name}>
                                {user.fullName}
                                <span className={styles.badges}>
                                    <UserBadges roles={user.roles} />
                                </span>
                            </h1>

                            <button
                                type="button"
                                className={styles.username}
                                onClick={copyUsername}
                                title="Copy username"
                            >
                                @{user.username}
                            </button>
                        </div>

                        <p className={styles.description}>{user.description || 'No bio yet'}</p>

                        {location && (
                            <p className={styles.location}>
                                <PlaceOutlinedIcon fontSize="small" />
                                {location}
                            </p>
                        )}
                    </div>
                </div>

                {stats && <div className={styles.mobileStats}>{stats}</div>}
            </div>
        </header>
    );
}
