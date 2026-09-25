'use client';

import { useState } from 'react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { ItemCard } from '@/entities/collection/ui/ItemCard';
import { ItemFormDialog } from '@/features/item/ui/ItemFormDialog';
import { ItemActions } from '@/features/item/ui/ItemActions';
import { useItemMutations } from '@/features/item/model/useItemMutations';
import { COLLECTION_ITEMS_LIMIT } from '@/shared/lib/constants';
import { ItemViewer } from './ItemViewer';
import { SortableItem } from './SortableItem';
import styles from './index.module.css';

type CollectionItemsGridProps = {
    collection: CollectionDetails;
    isOwner: boolean;
};

export function CollectionItemsGrid({ collection, isOwner }: CollectionItemsGridProps) {
    const { add, reorder } = useItemMutations(collection.id);
    const [adding, setAdding] = useState(false);
    const [viewing, setViewing] = useState<number | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const itemIds = collection.items.map((item) => item.id);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const from = itemIds.indexOf(Number(active.id));
        const to = itemIds.indexOf(Number(over.id));
        if (from === -1 || to === -1) return;

        reorder.mutate(arrayMove(itemIds, from, to));
    };

    const canAdd = isOwner && collection.items.length < COLLECTION_ITEMS_LIMIT;

    return (
        <section className={styles.wrapper} aria-label="Items">
            <header className={styles.header}>
                <h2 className={styles.title}>
                    Items <span className={styles.count}>{collection.items.length}</span>
                </h2>

                {canAdd && (
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={() => setAdding(true)}
                    >
                        <AddIcon fontSize="small" />
                        Add item
                    </button>
                )}
            </header>

            <div className={styles.grid}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                        {collection.items.map((item, index) => (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                size={item.size}
                                disabled={!isOwner}
                            >
                                {(dragHandleProps) => (
                                    <ItemCard
                                        item={item}
                                        onOpen={() => setViewing(index)}
                                        dragHandleProps={dragHandleProps}
                                        actions={
                                            isOwner && (
                                                <ItemActions
                                                    collectionId={collection.id}
                                                    item={item}
                                                    canDelete={collection.items.length > 1}
                                                />
                                            )
                                        }
                                    />
                                )}
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            {viewing !== null && (
                <ItemViewer
                    items={collection.items}
                    index={viewing}
                    onIndexChange={setViewing}
                    onClose={() => setViewing(null)}
                />
            )}

            {adding && (
                <ItemFormDialog
                    mode="create"
                    pending={add.isPending}
                    onClose={() => setAdding(false)}
                    onSubmit={(payload) =>
                        add.mutate(payload, { onSuccess: () => setAdding(false) })
                    }
                />
            )}
        </section>
    );
}
