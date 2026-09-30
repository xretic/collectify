'use client';

import { useLayoutEffect, useState } from 'react';

export type GridMetrics = {
    /** Column count the stylesheet resolved to (media and container queries included). */
    columns: number;
    /** Width of one column track, px. */
    columnWidth: number;
    rowGap: number;
    /** `grid-auto-rows` in px; 0 when rows size to their content. */
    rowHeight: number;
    /** Distance from the top of the document: a window virtualizer's `scrollMargin`. */
    top: number;
};

function read(element: HTMLElement): GridMetrics {
    const style = getComputedStyle(element);
    // The resolved value lists every track in px, so `auto-fill` is already expanded.
    const tracks = style.gridTemplateColumns.split(' ').filter(Boolean);

    return {
        columns: Math.max(1, tracks.length),
        columnWidth: Math.round(parseFloat(tracks[0] ?? '') || element.clientWidth),
        rowGap: parseFloat(style.rowGap) || 0,
        rowHeight: parseFloat(style.gridAutoRows) || 0,
        top: Math.round(element.getBoundingClientRect().top + window.scrollY),
    };
}

function same(a: GridMetrics, b: GridMetrics) {
    return (
        a.columns === b.columns &&
        a.columnWidth === b.columnWidth &&
        a.rowGap === b.rowGap &&
        a.rowHeight === b.rowHeight &&
        a.top === b.top
    );
}

/**
 * Reads a CSS grid's layout, so virtualized grids keep the stylesheet as the source of truth
 * for columns and gaps. `null` until measured: on the server and in the hydration render.
 */
export function useGridMetrics<T extends HTMLElement = HTMLDivElement>() {
    const [element, setElement] = useState<T | null>(null);
    const [metrics, setMetrics] = useState<GridMetrics | null>(null);

    useLayoutEffect(() => {
        if (!element) return;

        const update = () =>
            setMetrics((prev) => {
                const next = read(element);
                return prev && same(prev, next) ? prev : next;
            });

        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        // Anything above the grid that grows (filters, hero, fonts) resizes the body too.
        observer.observe(document.body);
        return () => observer.disconnect();
    }, [element]);

    return [setElement, metrics] as const;
}
