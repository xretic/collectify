import { USERNAME_MAX_LENGTH } from '@/lib/constans';

export function isUsernameValid(username: string): boolean {
    if (username.length > USERNAME_MAX_LENGTH) return false;

    const regex = /^[a-z0-9_.]+$/;
    return regex.test(username);
}
