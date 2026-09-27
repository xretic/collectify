'use client';

import { create } from 'zustand';

/** Cookie categories that need consent. "Necessary" ones never do (ePrivacy Art. 5(3)). */
export type ConsentCategory = 'analytics';

/** Optional categories this deployment actually uses: analytics only once a provider is set up. */
export const OPTIONAL_CATEGORIES: ConsentCategory[] = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER
    ? ['analytics']
    : [];

const STORAGE_KEY = 'collectify:consent';
/** Bumped when the categories change in a way that needs asking again. */
const VERSION = 1;

type Choices = Partial<Record<ConsentCategory, boolean>>;
type Stored = { version: number; choices: Choices; decidedAt: string };

type ConsentState = {
    /** Read from storage (after hydration; the server knows nothing about it). */
    loaded: boolean;
    decided: boolean;
    choices: Choices;
    settingsOpen: boolean;
    load: () => void;
    decide: (choices: Choices) => void;
    openSettings: () => void;
    closeSettings: () => void;
};

function readStored(): Stored | null {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Stored | null;
        return stored?.version === VERSION ? stored : null;
    } catch {
        return null;
    }
}

export const useConsentStore = create<ConsentState>((set) => ({
    loaded: false,
    decided: false,
    choices: {},
    settingsOpen: false,
    load: () => {
        const stored = readStored();
        // A category added since the last answer (e.g. analytics switched on) is asked about again.
        const decided =
            stored !== null && OPTIONAL_CATEGORIES.every((category) => category in stored.choices);
        set({ loaded: true, decided, choices: stored?.choices ?? {} });
    },
    decide: (choices) => {
        try {
            const stored: Stored = {
                version: VERSION,
                choices,
                decidedAt: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        } catch {
            // Storage blocked: the choice holds for this visit only.
        }
        set({ decided: true, choices, settingsOpen: false });
    },
    openSettings: () => set({ settingsOpen: true }),
    closeSettings: () => set({ settingsOpen: false }),
}));

/** Whether scripts of `category` may run (always `false` until the user said yes). */
export function hasConsent(category: ConsentCategory) {
    const { decided, choices } = useConsentStore.getState();
    return decided && choices[category] === true;
}

/** Same answer for every optional category ("Accept all" / "Reject all"). */
export const allChoices = (value: boolean): Choices =>
    Object.fromEntries(OPTIONAL_CATEGORIES.map((category) => [category, value]));
