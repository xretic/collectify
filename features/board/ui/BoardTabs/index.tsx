'use client';

import { useState } from 'react';
import {
    closestCenter,
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import type { Board } from '@/entities/board/model/types';
import { ActionsMenu, type ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { ScrollRow } from '@/shared/ui/ScrollRow';
import { TabIndicator } from '@/shared/ui/TabIndicator';
import { boardKey, useBoardOrder } from '../../model/useBoardOrder';
import { useBoardMutations } from '../../model/useBoardMutations';
import { useBoardActions } from '../BoardActions';
import { BoardNameDialog } from '../BoardNameDialog';
import styles from './index.module.css';

type BoardTabsProps = {
    /** Selected board; `undefined` = "All saved". */
    value: number | undefined;
    onChange: (boardId: number | undefined) => void;
};

/**
 * "All saved" + the user's boards as tabs, with create / rename / delete.
 * Boards can be dragged into any order (shared with the home feed tabs).
 */
export function BoardTabs({ value, onChange }: BoardTabsProps) {
    const { boards, keys, reorder } = useBoardOrder();
    const { create } = useBoardMutations();
    const [creating, setCreating] = useState(false);
    const actions = useBoardActions({ onDeleted: () => onChange(undefined) });

    const sensors = useSensors(
        // A short move starts a drag, so a plain click still selects the board.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (over) reorder(String(active.id), String(over.id));
    };

    return (
        <div className={styles.bar}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={keys} strategy={horizontalListSortingStrategy}>
                    <ScrollRow
                        rootClassName={styles.row}
                        className={styles.tabs}
                        role="tablist"
                        aria-label="Boards"
                        itemsLabel="boards"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={value === undefined}
                            className={`${styles.tab} ${value === undefined ? styles.active : ''}`}
                            onClick={() => onChange(undefined)}
                        >
                            <span className={`${styles.cover} ${styles.allCover}`}>
                                <BookmarkIcon fontSize="small" />
                            </span>
                            All
                        </button>

                        {boards.map((board) => (
                            <SortableBoardTab
                                key={board.id}
                                board={board}
                                active={board.id === value}
                                onSelect={() => onChange(board.id)}
                                actions={actions.items(board)}
                            />
                        ))}
                        <TabIndicator />
                    </ScrollRow>
                </SortableContext>
            </DndContext>

            <button type="button" className={styles.add} onClick={() => setCreating(true)}>
                <AddIcon fontSize="small" />
                New board
            </button>

            {creating && (
                <BoardNameDialog
                    title="New board"
                    submitLabel="Create"
                    pending={create.isPending}
                    onClose={() => setCreating(false)}
                    onSubmit={(name) =>
                        create.mutate(name, {
                            onSuccess: (board) => {
                                setCreating(false);
                                onChange(board.id);
                            },
                        })
                    }
                />
            )}

            {actions.dialogs}
        </div>
    );
}

type SortableBoardTabProps = {
    board: Board;
    active: boolean;
    onSelect: () => void;
    actions: ActionsMenuItem[];
};

function SortableBoardTab({ board, active, onSelect, actions }: SortableBoardTabProps) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: boardKey(board.id),
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            // The inner button is the tab; the wrapper is only the drag handle.
            role="presentation"
            tabIndex={-1}
            data-tab
            className={`${styles.tab} ${active ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
            // dnd-kit drives the offset per frame (horizontal only); it cannot live in a stylesheet.
            style={{
                transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
                transition,
            }}
        >
            <button
                type="button"
                role="tab"
                aria-selected={active}
                className={styles.tabButton}
                onClick={onSelect}
            >
                {board.covers[0] ? (
                    <img className={styles.cover} src={board.covers[0]} alt="" draggable={false} />
                ) : (
                    <span className={styles.cover} />
                )}
                <span className={styles.name}>{board.name}</span>
                <span className={styles.count}>{board.collections}</span>
            </button>

            {active && (
                <ActionsMenu label="Board actions" className={styles.menu} items={actions} />
            )}
        </div>
    );
}
