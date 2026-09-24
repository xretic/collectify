'use client';

import { useState } from 'react';
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { ItemCard } from '@/entities/collection/ui/ItemCard';
import { ItemFormDialog } from '@/features/item/ui/ItemFormDialog';
import { ItemActions } from '@/features/item/ui/ItemActions';
import { useItemMutations } from '@/features/item/model/useItemMutations';
import { COLLECTION_ITEMS_LIMIT } from '@/shared/lib/constants';
import { SortableItem } from './SortableItem';
import styles from './index.module.css';

type CollectionItemsGridProps = {
    collection: CollectionDetails;
    isOwner: boolean;
};

export function CollectionItemsGrid({ collection, isOwner }: CollectionItemsGridProps) {
    const { add, reorder } = useItemMutations(collection.id);
    const [adding, setAdding] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const itemIds = collection.items.map((item) => item.id);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        const from = itemIds.indexOf(Number(active.id));
        const to = itemIds.indexOf(Number(over.id));
        if (from === -1 || to === -1) return;

        reorder.mutate(arrayMove(itemIds, from, to));
    };

    return (
        <div className={styles.grid}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                    {collection.items.map((item) => (
                        <SortableItem key={item.id} id={item.id} disabled={!isOwner}>
                            {(dragHandleProps) => (
                                <ItemCard
                                    item={item}
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

            {isOwner && collection.items.length < COLLECTION_ITEMS_LIMIT && (
                <button
                    type="button"
                    className={styles.addItem}
                    onClick={() => setAdding(true)}
                    aria-label="Add item"
                >
                    <AddIcon />
                </button>
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
        </div>
    );
}
