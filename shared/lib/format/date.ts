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

const SHORT_UNITS: [string, number][] = [
    ['y', 365 * 24 * 60 * 60],
    ['w', 7 * 24 * 60 * 60],
    ['d', 24 * 60 * 60],
    ['h', 60 * 60],
    ['m', 60],
];

/** Compact age for lists: "now", "5m", "3h", "2d", "4w", "1y". */
export function formatShortRelative(value: string | Date, now = Date.now()): string {
    const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));

    for (const [unit, size] of SHORT_UNITS) {
        if (seconds >= size) return `${Math.floor(seconds / size)}${unit}`;
    }

    return 'now';
}

/** Chat timestamp divider: "14:32" today, "Mon 14:32" this week, "Sep 21, 14:32" before. */
export function formatChatTimestamp(value: string | Date, now = Date.now()): string {
    const date = new Date(value);
    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const startOfToday = new Date(now).setHours(0, 0, 0, 0);

    if (date.getTime() >= startOfToday) return time;
    if (now - date.getTime() < 6 * 24 * 60 * 60 * 1000) {
        return `${date.toLocaleDateString(undefined, { weekday: 'short' })} ${time}`;
    }

    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        ...(date.getFullYear() !== new Date(now).getFullYear() && { year: 'numeric' }),
        hour: '2-digit',
        minute: '2-digit',
    });
}
