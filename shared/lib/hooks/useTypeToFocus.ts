'use client';

import { useEffect, type RefObject } from 'react';

type Editable = HTMLInputElement | HTMLTextAreaElement;

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
/** Space / Enter activate these, so they must keep their keys. */
const ACTIVATABLE = 'button, a[href], summary, [role="button"], [role="menuitem"], [role="tab"]';

function focusAtEnd(field: Editable) {
    field.focus();
    const end = field.value.length;
    field.setSelectionRange(end, end);
}

/**
 * Chat-style input: focused when the page opens (on devices with a mouse, so
 * phones do not pop the keyboard), and re-focused when the user starts typing
 * or pastes anywhere else on the page — the key then lands in the field.
 */
export function useTypeToFocus(ref: RefObject<Editable | null>, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        if (window.matchMedia('(pointer: fine)').matches && ref.current) focusAtEnd(ref.current);

        const handleKeyDown = (event: KeyboardEvent) => {
            const field = ref.current;
            if (!field || event.defaultPrevented || event.isComposing) return;
            if (document.activeElement === field) return;

            const paste = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v';
            const printable =
                event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
            if (!paste && !printable) return;

            const target = event.target instanceof Element ? event.target : null;
            if (target?.closest(EDITABLE)) return;
            if (event.key === ' ' && target?.closest(ACTIVATABLE)) return;
            // A dialog (report, menus…) owns the keyboard while it is open.
            if (document.querySelector('[role="dialog"], [role="presentation"] [role="menu"]'))
                return;

            focusAtEnd(field);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [ref, enabled]);
}
