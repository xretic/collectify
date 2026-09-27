'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useFormatters } from '@/shared/lib/format/useFormatters';
import type { TopCreator } from '../../model/types';
import styles from './index.module.css';

type CreatorCardProps = {
    creator: TopCreator;
    /** Follow button. */
    action: ReactNode;
};

/** An author with covers of their best collections: a reason to follow, at a glance. */
export function CreatorCard({ creator, action }: CreatorCardProps) {
    const format = useFormatters();

    return (
        <article className={styles.card}>
            <div className={styles.covers}>
                {creator.covers.map((cover) => (
                    <img key={cover} src={cover} alt="" className={styles.cover} loading="lazy" />
                ))}
            </div>

            <div className={styles.body}>
                <Link href={`/users/${creator.id}`} target="_blank" className={styles.identity}>
                    <Avatar src={creator.avatarUrl} alt="" className={styles.avatar} />
                    <span className={styles.names}>
                        <span className={styles.name}>{creator.fullName}</span>
                        <span className={styles.meta}>
                            @{creator.username} · <FavoriteIcon className={styles.heart} />
                            {format.compact(creator.likes)}
                        </span>
                    </span>
                </Link>
                {action}
            </div>
        </article>
    );
}
