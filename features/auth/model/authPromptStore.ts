'use client';

import { create } from 'zustand';
import { rememberIntent, type PendingIntent } from './pendingIntent';

/** Why a guest is asked to join; picks the dialog's headline. */
export type AuthPromptReason =
    | 'like'
    | 'save'
    | 'comment'
    | 'follow'
    | 'message'
    | 'report'
    | 'create';

type AuthPromptState = {
    open: boolean;
    /** Kept after closing, so the headline does not change while the dialog fades out. */
    reason: AuthPromptReason;
    close: () => void;
};

/** One "join Collectify" dialog for the whole app (mounted in the root layout). */
export const useAuthPromptStore = create<AuthPromptState>((set) => ({
    open: false,
    reason: 'like',
    close: () => set({ open: false }),
}));

/**
 * Asks a guest to sign in instead of showing a dead, disabled button. With an
 * `intent`, the action happens by itself once they are back (see `useResumeIntent`).
 */
export function promptSignIn(reason: AuthPromptReason, intent?: PendingIntent) {
    if (intent) rememberIntent(intent);
    useAuthPromptStore.setState({ open: true, reason });
}
