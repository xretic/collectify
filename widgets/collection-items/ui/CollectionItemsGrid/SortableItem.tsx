'use client';

import type { ReactNode, HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './index.module.css';

type SortableItemProps = {
    id: number;
    disabled: boolean;
    children: (dragHandleProps: HTMLAttributes<HTMLButtonElement> | undefined) => ReactNode;
};

export function SortableItem({ id, disabled, children }: SortableItemProps) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.sortable} ${isDragging ? styles.dragging : ''}`}
            // dnd-kit drives the transform per frame; it cannot live in a stylesheet.
            style={{ transform: CSS.Transform.toString(transform), transition }}
            {...attributes}
        >
            {children(disabled ? undefined : (listeners as HTMLAttributes<HTMLButtonElement>))}
        </div>
    );
}
