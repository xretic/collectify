const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
];

/** "3 minutes ago", "yesterday", "now" — in the given UI language. */
export function formatRelative(locale: string, value: string | Date, now = Date.now()): string {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const seconds = Math.round((new Date(value).getTime() - now) / 1000);

    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }

    return formatter.format(0, 'second');
}

export function formatDateTime(locale: string, value: string | Date): string {
    return new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(locale: string, value: string | Date): string {
    return new Date(value).toLocaleDateString(locale, { dateStyle: 'medium' });
}

const SHORT_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
];

/** Compact age for lists: "now", "5m", "3h", "2d", "4w", "1y" (localized unit names). */
export function formatShortRelative(
    locale: string,
    value: string | Date,
    now = Date.now(),
): string {
    const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));

    for (const [unit, size] of SHORT_UNITS) {
        if (seconds >= size) {
            return new Intl.NumberFormat(locale, {
                style: 'unit',
                unit,
                unitDisplay: 'narrow',
            }).format(Math.floor(seconds / size));
        }
    }

    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' }).format(
        0,
        'second',
    );
}

/** Chat timestamp divider: "14:32" today, "Mon 14:32" this week, "Sep 21, 14:32" before. */
export function formatChatTimestamp(
    locale: string,
    value: string | Date,
    now = Date.now(),
): string {
    const date = new Date(value);
    const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const startOfToday = new Date(now).setHours(0, 0, 0, 0);

    if (date.getTime() >= startOfToday) return time;
    if (now - date.getTime() < 6 * 24 * 60 * 60 * 1000) {
        return `${date.toLocaleDateString(locale, { weekday: 'short' })} ${time}`;
    }

    return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        ...(date.getFullYear() !== new Date(now).getFullYear() && { year: 'numeric' }),
        hour: '2-digit',
        minute: '2-digit',
    });
}
