'use client';

import { useEffect, useRef } from 'react';
import { HTTPError } from 'ky';
import { DEFAULT_THEME } from '@/shared/config/themes';
import { useThemeStore } from '@/shared/model/themeStore';
import type { Appearance } from '@/shared/lib/validation/theme';
import { toast } from '@/shared/model/toastStore';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { userApi } from '@/entities/user/api/userApi';

/** Waits for a burst of changes (dragging through themes) before saving once. */
const SAVE_DELAY_MS = 500;

const snapshot = ({ theme, customThemes }: Appearance) => JSON.stringify({ theme, customThemes });

/** The debounced save waiting to run, if any. */
let pendingSave: (() => Promise<void>) | null = null;

/** Sends a waiting theme change now; call before signing out so it is not lost. */
export async function flushThemeSave() {
    const save = pendingSave;
    pendingSave = null;
    await save?.();
}

/**
 * Keeps the theme on the account. Signing in loads the account's themes on the
 * device (localStorage only caches them for a flash-free first paint); every
 * change is saved back; signing out, or an expired session, resets to the default.
 */
export function ThemeAccountSync() {
    const { user, loading } = useSessionUser();
    /** Whose themes the device shows: a user id, `null` for a guest, `undefined` before the session is known. */
    const loadedFor = useRef<number | null | undefined>(undefined);
    /** Last state known to match the server, so loading it is not saved back. */
    const saved = useRef<string | null>(null);
    const canSave = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (loading) return;
        const userId = user?.id ?? null;
        if (loadedFor.current === userId) return;

        clearTimeout(timer.current);
        pendingSave = null;
        const previous = loadedFor.current;
        loadedFor.current = userId;
        // Staff looking at an account see its theme but do not change it.
        canSave.current = Boolean(user && !user.impersonatorUserId);

        const store = useThemeStore.getState();
        if (!user) {
            saved.current = null;
            if (store.theme !== DEFAULT_THEME || store.customThemes.length) store.reset();
            return;
        }

        const { theme, customThemes } = user.appearance;
        if (theme) {
            saved.current = snapshot({ theme, customThemes });
            store.loadAccount(theme, customThemes);
            return;
        }

        saved.current = snapshot({ theme: DEFAULT_THEME, customThemes: [] });

        // Another account's themes are on screen (impersonation started or ended
        // in this tab): they must not become this account's.
        if (previous !== undefined) {
            if (store.theme !== DEFAULT_THEME || store.customThemes.length) store.reset();
            return;
        }

        // Nothing on the account yet: the device's choice (from before themes were
        // kept on accounts) becomes the account's.
        if (canSave.current && snapshot(store) !== saved.current) {
            saved.current = snapshot(store);
            // Best effort: the next change saves again anyway.
            userApi
                .saveAppearance({ theme: store.theme, customThemes: store.customThemes })
                .catch(() => {});
        }
    }, [user, loading]);

    useEffect(
        () =>
            useThemeStore.subscribe((state) => {
                if (!canSave.current || snapshot(state) === saved.current) return;

                const save = async () => {
                    pendingSave = null;
                    const { theme, customThemes } = useThemeStore.getState();
                    const next = snapshot({ theme, customThemes });
                    if (!canSave.current || next === saved.current) return;
                    try {
                        await userApi.saveAppearance({ theme, customThemes });
                        saved.current = next;
                    } catch (error) {
                        // Signed out meanwhile: nothing to save to.
                        if (error instanceof HTTPError && error.response.status === 401) return;
                        toast.error(await getApiErrorMessage(error));
                    }
                };

                clearTimeout(timer.current);
                pendingSave = save;
                timer.current = setTimeout(save, SAVE_DELAY_MS);
            }),
        [],
    );

    return null;
}
