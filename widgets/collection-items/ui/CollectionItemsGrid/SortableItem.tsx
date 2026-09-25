'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemSize } from '@/entities/collection/model/types';
import styles from './index.module.css';

type SortableItemProps = {
    id: number;
    size: ItemSize;
    disabled: boolean;
    children: (dragHandleProps: HTMLAttributes<HTMLButtonElement> | undefined) => ReactNode;
};

/** Grid cell (its size sets the footprint) that can be dragged to reorder. */
export function SortableItem({ id, size, disabled, children }: SortableItemProps) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.cell} ${styles[`size${size}`]} ${isDragging ? styles.dragging : ''}`}
            // dnd-kit drives the transform per frame; it cannot live in a stylesheet.
            style={{ transform: CSS.Translate.toString(transform), transition }}
            {...attributes}
            // The card itself is the interactive element; the cell is only a layout box.
            role={undefined}
            tabIndex={undefined}
        >
            {children(disabled ? undefined : (listeners as HTMLAttributes<HTMLButtonElement>))}
        </div>
    );
}
