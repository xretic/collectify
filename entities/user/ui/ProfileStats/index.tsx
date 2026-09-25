'use client';

import type { FollowListKind } from '../../model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type ProfileStatsProps = {
    followers: number;
    subscriptions: number;
    /** `pill` in the filter toolbar; `card` as the footer of the profile card on phones. */
    variant?: 'pill' | 'card';
    /** Makes the counters clickable (opens the followers / following list). */
    onSelect?: (kind: FollowListKind) => void;
};

/** Follower / following counters. */
export function ProfileStats({
    followers,
    subscriptions,
    variant = 'pill',
    onSelect,
}: ProfileStatsProps) {
    const t = useTranslations('profile');

    const stat = (kind: FollowListKind, label: string, value: number) =>
        onSelect ? (
            <button
                type="button"
                className={`${styles.stat} ${styles.clickable}`}
                onClick={() => onSelect(kind)}
                aria-label={t('statLabel', { count: value, label })}
            >
                <span className={styles.label}>{label}</span>
                <span className={styles.number}>{value}</span>
            </button>
        ) : (
            <div className={styles.stat}>
                <dt className={styles.label}>{label}</dt>
                <dd className={styles.number}>{value}</dd>
            </div>
        );

    const Wrapper = onSelect ? 'div' : 'dl';

    return (
        <Wrapper className={`${styles.stats} ${styles[variant]}`}>
            {stat('following', t('following'), subscriptions)}
            <div className={styles.divider} />
            {stat('followers', t('followers'), followers)}
        </Wrapper>
    );
}
