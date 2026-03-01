import { Skeleton, useMediaQuery } from '@mui/material';
import styles from '../../features/collections/CollectionsWrapper/index.module.css';
import { PAGE_SIZE } from '@/lib/constans';

export default function CollectionWrapperSkeleton() {
    const isMobile = useMediaQuery('(max-width:1000px)');

    return (
        <>
            <div className={styles.collections}>
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <Skeleton
                        key={index}
                        variant="rounded"
                        height="256px"
                        width={isMobile ? '356px' : '256px'}
                        sx={{ borderRadius: 6 }}
                    />
                ))}
            </div>

            <div className={styles.pagination}>
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={40} height={40} />
            </div>
        </>
    );
}
