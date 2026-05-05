import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItemCard({
    id,
    disabled,
    children,
}: {
    id: number;
    disabled: boolean;
    children: (args: {
        setNodeRef: (node: HTMLElement | null) => void;
        style: React.CSSProperties;
        attributes: React.HTMLAttributes<HTMLElement>;
        listeners: React.HTMLAttributes<HTMLElement>;
        isDragging: boolean;
    }) => React.ReactNode;
}) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        touchAction: 'none',
    };

    return (
        <>
            {children({
                setNodeRef,
                style,
                attributes: attributes as React.HTMLAttributes<HTMLElement>,
                listeners: (listeners ?? {}) as React.HTMLAttributes<HTMLElement>,
                isDragging,
            })}
        </>
    );
}
