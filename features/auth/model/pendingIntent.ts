'use client';

/**
 * What a guest tried to do before being asked to sign in. It survives the
 * sign-up / OAuth round trip in `sessionStorage` (same tab), and the button
 * that started it performs it once the user is back and signed in.
 */
export type PendingIntent = { kind: 'like' | 'save' | 'follow'; id: number };

const KEY = 'collectify:pending-intent';
/** Older intents are dropped: the user probably moved on. */
const MAX_AGE_MS = 30 * 60 * 1000;

export function rememberIntent(intent: PendingIntent) {
    try {
        sessionStorage.setItem(KEY, JSON.stringify({ ...intent, at: Date.now() }));
    } catch {
        // Storage blocked: the user just repeats the action after signing in.
    }
}

/** `true` (and forgets it) when `intent` is the one waiting to be resumed. */
export function takeIntent(intent: PendingIntent): boolean {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return false;

        const saved = JSON.parse(raw) as PendingIntent & { at: number };
        if (saved.kind !== intent.kind || saved.id !== intent.id) return false;

        sessionStorage.removeItem(KEY);
        return Date.now() - saved.at < MAX_AGE_MS;
    } catch {
        return false;
    }
}
