import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '@/shared/lib/constants';

/** "Anna.Smith+news@mail.com" → "anna.smith": a starting point, the user can change it. */
export function suggestUsername(email: string) {
    const local = email.split('@')[0] ?? '';
    const candidate = local
        .split('+')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '')
        .slice(0, USERNAME_MAX_LENGTH);

    return candidate.length >= USERNAME_MIN_LENGTH ? candidate : '';
}
