'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Avatar, Skeleton } from '@mui/material';
import type { CollectionDetails } from '../../model/types';
import styles from './index.module.css';
import { useCategoryName } from '@/entities/category/model/useCategoryName';

type CollectionHeroProps = {
    collection: CollectionDetails;
    /** Next to the author (e.g. a Follow button). */
    authorAction?: ReactNode;
};

export function CollectionHero({ collection, authorAction }: CollectionHeroProps) {
    const categoryName = useCategoryName();

    return (
        <div className={styles.hero}>
            <img className={styles.banner} src={collection.bannerUrl} alt="" />
            <div className={styles.shade} />

            <div className={styles.overlay}>
                <span className={styles.category}>{categoryName(collection.category)}</span>
                <h1 className={styles.title}>{collection.name}</h1>

                <div className={styles.byline}>
                    <Link href={`/users/${collection.author.id}`} className={styles.author}>
                        <Avatar
                            src={collection.author.avatarUrl}
                            alt={collection.author.fullName}
                            className={styles.avatar}
                        />
                        <span>{collection.author.fullName}</span>
                    </Link>
                    {authorAction}
                </div>
            </div>
        </div>
    );
}

export function CollectionHeroSkeleton() {
    return <Skeleton variant="rectangular" className={styles.hero} />;
}
