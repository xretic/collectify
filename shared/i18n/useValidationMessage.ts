'use client';

import { useTranslations } from 'next-intl';
import { isValidationKey, VALIDATION_VALUES } from '@/shared/lib/validation/messages';
import type { LooseTranslator } from './types';

/** Translates a schema message key (`validation.*`) from a form error. */
export function useValidationMessage() {
    const t = useTranslations() as unknown as LooseTranslator;

    return (message: string | undefined) =>
        message && isValidationKey(message) && t.has(message)
            ? t(message, VALIDATION_VALUES)
            : message;
}
