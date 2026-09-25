import type en from './messages/en.json';

export type Messages = typeof en;

export type TranslationValues = Record<string, string | number | Date>;

/**
 * A translator addressed by a runtime string key (validation keys from zod
 * issues, error keys from the API) rather than a statically checked one.
 */
export type LooseTranslator = {
    (key: string, values?: TranslationValues): string;
    has(key: string): boolean;
};
