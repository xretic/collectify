import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/constans';

export function isPasswordValid(password: string): boolean {
    if (password.length < PASSWORD_MIN_LENGTH) return false;
    if (password.length > PASSWORD_MAX_LENGTH) return false;

    const regex = /^[a-zA-Z0-9!@#$%^&*()]+$/;
    return regex.test(password);
}
