const compactFormatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

/** 950 → "950", 1615 → "1.6K", 2_300_000 → "2.3M". */
export function formatCompact(value: number): string {
    return compactFormatter.format(value);
}
