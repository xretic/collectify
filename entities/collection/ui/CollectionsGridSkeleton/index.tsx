import { Skeleton } from '@mui/material';
import { PAGE_SIZE } from '@/shared/lib/constants';
import gridStyles from '../CollectionsGrid/index.module.css';
import styles from './index.module.css';

export function CollectionsGridSkeleton() {
    return (
        <div className={gridStyles.grid}>
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <Skeleton key={index} variant="rounded" className={styles.card} />
            ))}
        </div>
    );
}
