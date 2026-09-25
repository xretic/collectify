/** 950 → "950", 1615 → "1.6K", 2_300_000 → "2.3M" (localized: "1,6 tis.", "1.6万"). */
export function formatCompact(locale: string, value: number): string {
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}
