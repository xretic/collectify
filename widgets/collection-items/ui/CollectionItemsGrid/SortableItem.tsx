'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemSize } from '@/entities/collection/model/types';
import type { Placement } from '../../lib/packItems';
import styles from './index.module.css';

type SortableItemProps = {
    id: number;
    size: ItemSize;
    /** Fixed grid lines once the grid is virtualized; without it the tile flows. */
    placement?: Placement;
    disabled: boolean;
    children: (dragHandleProps: HTMLAttributes<HTMLButtonElement> | undefined) => ReactNode;
};

/** Grid cell (its size sets the footprint) that can be dragged to reorder. */
export function SortableItem({ id, size, placement, disabled, children }: SortableItemProps) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.cell} ${styles[`size${size}`]} ${placement ? styles.placed : ''} ${isDragging ? styles.dragging : ''}`}
            // dnd-kit drives the transform per frame and the packing sets the lines;
            // neither can live in a stylesheet.
            style={
                {
                    transform: CSS.Translate.toString(transform),
                    transition,
                    '--row': placement?.row,
                    '--column': placement?.column,
                } as CSSProperties
            }
            {...attributes}
            // The card itself is the interactive element; the cell is only a layout box.
            role={undefined}
            tabIndex={undefined}
        >
            {children(disabled ? undefined : (listeners as HTMLAttributes<HTMLButtonElement>))}
        </div>
    );
}
