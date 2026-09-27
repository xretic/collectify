import { PLACEHOLDER_EMAIL_DOMAIN } from '@/shared/lib/constants';

/** OAuth accounts without a provider-verified address have a placeholder nobody can receive. */
export const isPlaceholderEmail = (email: string) =>
    email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
