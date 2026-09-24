import { describe, expect, it } from 'vitest';
import { expiresAtFromDuration, isStrongerOrEqual } from '@/entities/sanction/model/types';
import { reportOpenKey } from '@/entities/report/model/types';
import { formatRelative } from '@/shared/lib/format/date';

describe('isStrongerOrEqual', () => {
    const soon = new Date('2030-01-01T00:00:00Z');
    const later = new Date('2031-01-01T00:00:00Z');

    it('treats permanent (null) as the strongest', () => {
        expect(isStrongerOrEqual(null, later)).toBe(true);
        expect(isStrongerOrEqual(later, null)).toBe(false);
        expect(isStrongerOrEqual(null, null)).toBe(true);
    });

    it('compares expiry dates', () => {
        expect(isStrongerOrEqual(later, soon)).toBe(true);
        expect(isStrongerOrEqual(soon, later)).toBe(false);
    });
});

describe('expiresAtFromDuration', () => {
    it('adds the duration to now', () => {
        const now = Date.UTC(2030, 0, 1);
        expect(expiresAtFromDuration('1h', now)?.getTime()).toBe(now + 3_600_000);
        expect(expiresAtFromDuration('permanent', now)).toBeNull();
    });
});

describe('reportOpenKey', () => {
    it('matches the format used by the migration', () => {
        expect(reportOpenKey(7, 'COMMENT', 12)).toBe('7:COMMENT:12');
    });
});

describe('formatRelative', () => {
    const now = Date.UTC(2030, 0, 10, 12);

    it('formats recent times', () => {
        expect(formatRelative(new Date(now - 10_000), now)).toBe('just now');
        expect(formatRelative(new Date(now - 5 * 60_000), now)).toMatch(/5 minutes ago/);
        expect(formatRelative(new Date(now - 2 * 86_400_000), now)).toMatch(/2 days ago/);
    });
});
