import Link from 'next/link';
import { Avatar, Skeleton } from '@mui/material';
import type { CollectionDetails } from '../../model/types';
import styles from './index.module.css';

export function CollectionHero({ collection }: { collection: CollectionDetails }) {
    return (
        <div className={styles.hero}>
            <img className={styles.banner} src={collection.bannerUrl} alt="" />
            <div className={styles.shade} />

            <div className={styles.overlay}>
                <span className={styles.category}>{collection.category.name}</span>
                <h1 className={styles.title}>{collection.name}</h1>

                <Link href={`/users/${collection.author.id}`} className={styles.author}>
                    <Avatar
                        src={collection.author.avatarUrl}
                        alt={collection.author.fullName}
                        className={styles.avatar}
                    />
                    <span>{collection.author.fullName}</span>
                </Link>
            </div>
        </div>
    );
}

export function CollectionHeroSkeleton() {
    return <Skeleton variant="rectangular" className={styles.hero} />;
}
