import { Skeleton } from '@mui/material';
import styles from '../../../app/collections/collections.module.css';

export default function CollectionPageSkeleton() {
    return (
        <>
            <div className={styles.container}>
                <Skeleton variant="rounded" height="100%" />
            </div>

            <div className="mt-5 flex justify-center items-center">
                <Skeleton
                    variant="rounded"
                    height="169px"
                    width="1450px"
                    sx={{ borderRadius: 4 }}
                />
            </div>

            <div className={styles.itemsGrid}>
                {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={95} sx={{ borderRadius: 4 }} />
                ))}
            </div>

            <div className="mt-12 flex justify-center items-center">
                <Skeleton
                    variant="rounded"
                    height="169px"
                    width="1450px"
                    sx={{ borderRadius: 4 }}
                />
            </div>
        </>
    );
}
