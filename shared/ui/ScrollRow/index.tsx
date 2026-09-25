'use client';

import { useCallback, useEffect, useRef, useState, type HTMLAttributes } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import styles from './index.module.css';

/** Share of the visible width one arrow click scrolls by. */
const SCROLL_STEP = 0.7;

type ScrollRowProps = HTMLAttributes<HTMLDivElement> & {
    /** Accessible name for the arrows, e.g. "feeds" → "Scroll feeds forward". */
    itemsLabel: string;
    /** Class for the outer box (margins, layout); `className` styles the scroller. */
    rootClassName?: string;
};

/**
 * Horizontal row without a scrollbar: edges fade out and arrow buttons appear
 * on the side that still has hidden content. Extra props go to the scroller.
 */
export function ScrollRow({
    itemsLabel,
    rootClassName,
    className,
    children,
    onScroll,
    ...rest
}: ScrollRowProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const [overflow, setOverflow] = useState({ start: false, end: false });

    const update = useCallback(() => {
        const list = listRef.current;
        if (!list) return;

        const { scrollLeft, scrollWidth, clientWidth } = list;
        const start = scrollLeft > 1;
        const end = scrollLeft + clientWidth < scrollWidth - 1;
        setOverflow((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    }, []);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;

        update();
        // The row resizes with the page; its content changes as items load or reorder.
        const resize = new ResizeObserver(update);
        resize.observe(list);
        const mutation = new MutationObserver(update);
        mutation.observe(list, { childList: true, subtree: true, characterData: true });

        return () => {
            resize.disconnect();
            mutation.disconnect();
        };
    }, [update]);

    const scrollBy = (direction: 1 | -1) => {
        const list = listRef.current;
        if (!list) return;
        list.scrollBy({ left: direction * list.clientWidth * SCROLL_STEP, behavior: 'smooth' });
    };

    return (
        <div className={`${styles.root} ${rootClassName ?? ''}`}>
            <button
                type="button"
                className={`${styles.arrow} ${styles.arrowStart} ${overflow.start ? styles.arrowVisible : ''}`}
                onClick={() => scrollBy(-1)}
                aria-label={`Scroll ${itemsLabel} back`}
                tabIndex={overflow.start ? 0 : -1}
            >
                <ChevronLeftIcon />
            </button>

            <div
                ref={listRef}
                {...rest}
                className={`${styles.list} ${overflow.start ? styles.fadeStart : ''} ${overflow.end ? styles.fadeEnd : ''} ${className ?? ''}`}
                onScroll={(event) => {
                    update();
                    onScroll?.(event);
                }}
            >
                {children}
            </div>

            <button
                type="button"
                className={`${styles.arrow} ${styles.arrowEnd} ${overflow.end ? styles.arrowVisible : ''}`}
                onClick={() => scrollBy(1)}
                aria-label={`Scroll ${itemsLabel} forward`}
                tabIndex={overflow.end ? 0 : -1}
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
}
