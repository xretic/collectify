'use client';

import { formatDateTime, formatRelative } from '@/shared/lib/format/date';
import { useNow } from '@/shared/lib/hooks/useNow';

type RelativeTimeProps = {
    value: string;
    className?: string;
};

export function RelativeTime({ value, className }: RelativeTimeProps) {
    const now = useNow();

    return (
        <time
            className={className}
            dateTime={value}
            title={formatDateTime(value)}
            suppressHydrationWarning
        >
            {formatRelative(value, now)}
        </time>
    );
}
