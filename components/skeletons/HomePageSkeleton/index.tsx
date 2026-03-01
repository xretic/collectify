import { Skeleton } from '@mui/material';
import styles from '../../../app/(home)/home.module.css';
import { CATEGORIES } from '@/lib/constans';
import CollectionWrapperSkeleton from '../CollectionWrapperSkeleton';

export default function HomePageSkeleton() {
    return (
        <>
            <div className={styles['container']}>
                <div className={styles['title']}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton width={300} />
                </div>

                <div className={styles['categories']}>
                    {Array.from({ length: CATEGORIES.length + 1 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            variant="rounded"
                            width={85}
                            height={38}
                            sx={{ borderRadius: 6 }}
                        />
                    ))}
                </div>

                <CollectionWrapperSkeleton />
            </div>
        </>
    );
}
