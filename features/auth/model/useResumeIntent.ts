'use client';

import { useEffect, useEffectEvent } from 'react';
import { takeIntent, type PendingIntent } from './pendingIntent';

/**
 * Performs the action a guest started (see `promptSignIn`) once `ready`
 * (signed in and the action still makes sense).
 */
export function useResumeIntent(intent: PendingIntent, ready: boolean, run: () => void) {
    const perform = useEffectEvent(run);
    const { kind, id } = intent;

    useEffect(() => {
        if (ready && takeIntent({ kind, id })) perform();
    }, [ready, kind, id]);
}
