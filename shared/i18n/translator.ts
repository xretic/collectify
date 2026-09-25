import type { LooseTranslator, TranslationValues } from './types';

let current: LooseTranslator | null = null;

/** Registered by `I18nBridge`, so plain modules (API helpers, stores) can translate too. */
export function setGlobalTranslator(translator: LooseTranslator) {
    current = translator;
}

export function translate(key: string, values?: TranslationValues): string {
    return current?.has(key) ? current(key, values) : key;
}
