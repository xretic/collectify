const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
];

/** "3 minutes ago", "yesterday", "just now". */
export function formatRelative(value: string | Date, now = Date.now()): string {
    const seconds = Math.round((new Date(value).getTime() - now) / 1000);

    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) {
            return relativeFormatter.format(Math.round(seconds / size), unit);
        }
    }

    return 'just now';
}

export function formatDateTime(value: string | Date): string {
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}
