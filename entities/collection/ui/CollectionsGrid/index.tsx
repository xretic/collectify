import { EmptyState } from '@/shared/ui/EmptyState';
import type { CollectionCard as CollectionCardData } from '../../model/types';
import { CollectionCard } from '../CollectionCard';
import styles from './index.module.css';

export function CollectionsGrid({ collections }: { collections: CollectionCardData[] }) {
    if (collections.length === 0) {
        return <EmptyState title="We found nothing" description="Try another filter or search." />;
    }

    return (
        <div className={styles.grid}>
            {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
            ))}
        </div>
    );
}
