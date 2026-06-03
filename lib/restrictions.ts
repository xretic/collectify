import { UserRestrictionInResponse } from '@/types/UserInResponse';

export function getMutePlaceholder(
    restriction: UserRestrictionInResponse | undefined,
    place: string,
    fallback: string,
) {
    if (!restriction?.muted) return fallback;

    if (!restriction.expiresAt) {
        return `You are permanently muted in ${place}.`;
    }

    return `You are muted in ${place} until ${new Date(restriction.expiresAt).toLocaleString(
        undefined,
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    )}.`;
}
