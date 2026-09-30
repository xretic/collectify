'use client';

import { useMemo, useState, type CSSProperties } from 'react';
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
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { ItemCard } from '@/entities/collection/ui/ItemCard';
import { ItemFormDialog } from '@/features/item/ui/ItemFormDialog';
import { ItemActions } from '@/features/item/ui/ItemActions';
import { useItemMutations } from '@/features/item/model/useItemMutations';
import { COLLECTION_ITEMS_LIMIT } from '@/shared/lib/constants';
import { useGridMetrics } from '@/shared/lib/hooks/useGridMetrics';
import { packItems } from '../../lib/packItems';
import { ItemViewer } from './ItemViewer';
import { SortableItem } from './SortableItem';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type CollectionItemsGridProps = {
    collection: CollectionDetails;
    isOwner: boolean;
};

export function CollectionItemsGrid({ collection, isOwner }: CollectionItemsGridProps) {
    const t = useTranslations('items');
    const { add, reorder } = useItemMutations(collection.id);
    const [adding, setAdding] = useState(false);
    const [viewing, setViewing] = useState<number | null>(null);
    const [dragging, setDragging] = useState<number | null>(null);
    const [gridRef, grid] = useGridMetrics();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const itemIds = collection.items.map((item) => item.id);
    const columns = grid?.columns;
    const layout = useMemo(
        () =>
            columns
                ? packItems(
                      collection.items.map((item) => item.size),
                      columns,
                  )
                : null,
        [collection.items, columns],
    );

    // Virtualizes grid rows, not tiles: a tile is mounted while any of its rows is near the viewport.
    const virtualizer = useWindowVirtualizer({
        count: layout?.rowCount ?? 0,
        estimateSize: () => grid?.rowHeight ?? 0,
        gap: grid?.rowGap ?? 0,
        overscan: 3,
        scrollMargin: grid?.top ?? 0,
        enabled: layout !== null,
    });
    const rows = virtualizer.getVirtualItems();
    const firstRow = (rows[0]?.index ?? 0) + 1;
    const lastRow = (rows.at(-1)?.index ?? -1) + 1;

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setDragging(null);
        if (!over || active.id === over.id) return;

        const from = itemIds.indexOf(Number(active.id));
        const to = itemIds.indexOf(Number(over.id));
        if (from === -1 || to === -1) return;

        reorder.mutate(arrayMove(itemIds, from, to));
    };

    const canAdd = isOwner && collection.items.length < COLLECTION_ITEMS_LIMIT;

    return (
        <section className={styles.wrapper} aria-label={t('label')}>
            <header className={styles.header}>
                <h2 className={styles.title}>
                    {t('label')} <span className={styles.count}>{collection.items.length}</span>
                </h2>

                {canAdd && (
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={() => setAdding(true)}
                    >
                        <AddIcon fontSize="small" />
                        {t('add')}
                    </button>
                )}
            </header>

            <div
                ref={gridRef}
                className={`${styles.grid} ${layout ? styles.virtual : ''}`}
                // Explicit rows keep the grid its full height while most tiles are unmounted.
                style={layout ? ({ '--rows': layout.rowCount } as CSSProperties) : undefined}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => setDragging(Number(active.id))}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setDragging(null)}
                >
                    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                        {collection.items.map((item, index) => {
                            const placement = layout?.placements[index];
                            const visible =
                                !placement ||
                                item.id === dragging ||
                                (placement.row <= lastRow &&
                                    placement.row + placement.rows > firstRow);
                            if (!visible) return null;

                            return (
                                <SortableItem
                                    key={item.id}
                                    id={item.id}
                                    size={item.size}
                                    placement={placement}
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
                            );
                        })}
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
