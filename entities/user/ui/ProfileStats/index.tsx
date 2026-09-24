import styles from './index.module.css';

type ProfileStatsProps = {
    followers: number;
    subscriptions: number;
    /** `pill` in the filter toolbar; `card` as the footer of the profile card on phones. */
    variant?: 'pill' | 'card';
};

/** Follower / following counters. */
export function ProfileStats({ followers, subscriptions, variant = 'pill' }: ProfileStatsProps) {
    return (
        <dl className={`${styles.stats} ${styles[variant]}`}>
            <div className={styles.stat}>
                <dt className={styles.label}>following</dt>
                <dd className={styles.number}>{subscriptions}</dd>
            </div>

            <div className={styles.divider} />

            <div className={styles.stat}>
                <dt className={styles.label}>followers</dt>
                <dd className={styles.number}>{followers}</dd>
            </div>
        </dl>
    );
}
