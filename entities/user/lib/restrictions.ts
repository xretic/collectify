import type { UserRestriction } from '../model/types';
import { formatDateTime } from '@/shared/lib/format/date';

/** Placeholder for an input the user is muted from, or `fallback` when not muted. */
export function getMutePlaceholder(
    restriction: UserRestriction | undefined,
    place: string,
    fallback: string,
) {
    if (!restriction?.muted) return fallback;

    return restriction.expiresAt
        ? `You are muted in ${place} until ${formatDateTime(restriction.expiresAt)}.`
        : `You are permanently muted in ${place}.`;
}
