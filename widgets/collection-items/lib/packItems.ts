import type { ItemSize } from '@/entities/collection/model/types';

/** 1-based grid lines where a tile starts, and how many tracks it spans. */
export type Placement = { row: number; column: number; rows: number; columns: number };

/** Footprints from the stylesheet: S = 1×1 · M = 1×2 · L = 2×2 · XL = full width × 2. */
const SPANS: Record<ItemSize, { rows: number; columns: number | 'full' }> = {
    S: { rows: 1, columns: 1 },
    M: { rows: 2, columns: 1 },
    L: { rows: 2, columns: 2 },
    XL: { rows: 2, columns: 'full' },
};

/**
 * Places tiles the way CSS `grid-auto-flow: row dense` does: each one takes the first free
 * spot from the top left. Knowing every tile's rows up front lets the grid mount only the
 * rows near the viewport without the others collapsing.
 */
export function packItems(sizes: ItemSize[], columnCount: number) {
    const taken: boolean[][] = [];

    const fits = (row: number, column: number, rows: number, columns: number) => {
        for (let r = row; r < row + rows; r++) {
            for (let c = column; c < column + columns; c++) {
                if (taken[r]?.[c]) return false;
            }
        }
        return true;
    };

    const take = (row: number, column: number, rows: number, columns: number) => {
        for (let r = row; r < row + rows; r++) {
            taken[r] ??= [];
            for (let c = column; c < column + columns; c++) taken[r][c] = true;
        }
    };

    const placements = sizes.map((size): Placement => {
        const span = SPANS[size];
        const columns = span.columns === 'full' ? columnCount : Math.min(span.columns, columnCount);

        for (let row = 0; ; row++) {
            for (let column = 0; column + columns <= columnCount; column++) {
                if (fits(row, column, span.rows, columns)) {
                    take(row, column, span.rows, columns);
                    return { row: row + 1, column: column + 1, rows: span.rows, columns };
                }
            }
        }
    });

    return { placements, rowCount: taken.length };
}
