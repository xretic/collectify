'use client';

import { useNow } from '@/shared/lib/hooks/useNow';
import { useFormatters } from '@/shared/lib/format/useFormatters';

type RelativeTimeProps = {
    value: string;
    className?: string;
};

export function RelativeTime({ value, className }: RelativeTimeProps) {
    const now = useNow();
    const format = useFormatters();

    return (
        <time
            className={className}
            dateTime={value}
            title={format.dateTime(value)}
            suppressHydrationWarning
        >
            {format.relative(value, now)}
        </time>
    );
}
