'use client';

import type { ReactNode } from 'react';
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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import { boardKey, useBoardOrder } from '@/features/board/model/useBoardOrder';
import { useBoardActions } from '@/features/board/ui/BoardActions';
import { ActionsMenu, type ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { ScrollRow } from '@/shared/ui/ScrollRow';
import { TabIndicator } from '@/shared/ui/TabIndicator';
import styles from './index.module.css';

export type Feed = { kind: 'for-you' } | { kind: 'explore' } | { kind: 'board'; boardId: number };

type FeedTabsProps = {
    value: Feed;
    onChange: (feed: Feed) => void;
};

type Tab = {
    key: string;
    feed: Feed;
    label: ReactNode;
    title?: string;
    /** Rename / delete, shown on the selected board tab. */
    actions?: ActionsMenuItem[];
};

const feedKey = (feed: Feed) => (feed.kind === 'board' ? boardKey(feed.boardId) : feed.kind);

// Always first, in this order; only board tabs can be reordered.
const PINNED: Tab[] = [
    {
        key: 'for-you',
        feed: { kind: 'for-you' },
        label: (
            <>
                <AutoAwesomeIcon fontSize="small" />
                For you
            </>
        ),
    },
    {
        key: 'explore',
        feed: { kind: 'explore' },
        label: (
            <>
                <ExploreOutlinedIcon fontSize="small" />
                Explore
            </>
        ),
    },
];

/**
 * Pinterest-like feed switcher: personal feed, everything, and one tab per
 * board. Board tabs can be dragged into any order; the order is saved to the account.
 */
export function FeedTabs({ value, onChange }: FeedTabsProps) {
    const { boards, keys, reorder } = useBoardOrder();
    const actions = useBoardActions({
        // Its feed is gone with it.
        onDeleted: (board) => {
            if (value.kind === 'board' && value.boardId === board.id) onChange({ kind: 'for-you' });
        },
    });

    const boardTabs = boards.map(
        (board): Tab => ({
            key: boardKey(board.id),
            feed: { kind: 'board', boardId: board.id },
            title: `More like “${board.name}”`,
            actions: actions.items(board),
            label: (
                <>
                    {board.covers[0] && (
                        <img className={styles.cover} src={board.covers[0]} alt="" />
                    )}
                    {board.name}
                </>
            ),
        }),
    );

    const sensors = useSensors(
        // A short move starts a drag, so a plain click still switches tabs.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    );

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (over) reorder(String(active.id), String(over.id));
    };

    const activeKey = feedKey(value);

    return (
        <>
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
                        aria-label="Feeds"
                        itemsLabel="feeds"
                    >
                        {PINNED.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={tab.key === activeKey}
                                className={`${styles.tab} ${tab.key === activeKey ? styles.active : ''}`}
                                onClick={() => onChange(tab.feed)}
                            >
                                {tab.label}
                            </button>
                        ))}
                        {boardTabs.map((tab) => (
                            <SortableTab
                                key={tab.key}
                                tab={tab}
                                active={tab.key === activeKey}
                                onSelect={() => onChange(tab.feed)}
                            />
                        ))}
                        <TabIndicator />
                    </ScrollRow>
                </SortableContext>
            </DndContext>
            {actions.dialogs}
        </>
    );
}

type SortableTabProps = {
    tab: Tab;
    active: boolean;
    onSelect: () => void;
};

function SortableTab({ tab, active, onSelect }: SortableTabProps) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: tab.key,
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
            className={`${styles.tab} ${styles.boardTab} ${active ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
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
                aria-roledescription="draggable tab"
                className={styles.tabButton}
                onClick={onSelect}
                title={tab.title}
            >
                {tab.label}
            </button>

            {active && tab.actions && (
                <ActionsMenu label="Board actions" className={styles.menu} items={tab.actions} />
            )}
        </div>
    );
}
