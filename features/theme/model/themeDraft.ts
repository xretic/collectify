import type { ThemeColors, ThemeToken } from '@/shared/config/themes';
import {
    autoColor,
    CONTRAST_CHECKS,
    fixAll,
    fixedColor,
    isMainToken,
    rederive,
    type ContrastCheck,
} from '../lib/palette';

type Snapshot = { colors: ThemeColors; manual: ThemeToken[] };

export type ThemeDraft = Snapshot & {
    name: string;
    /** Earlier snapshots for Undo, newest last. */
    history: Snapshot[];
};

export type DraftAction =
    | { type: 'rename'; name: string }
    /** Remembers the current colors so the next edits can be undone as one step. */
    | { type: 'checkpoint' }
    | { type: 'set'; token: ThemeToken; value: string }
    | { type: 'auto'; token: ThemeToken }
    | { type: 'load'; colors: ThemeColors }
    | { type: 'fix'; check: ContrastCheck['id'] }
    | { type: 'fixAll' }
    | { type: 'undo' };

const HISTORY_LIMIT = 50;

const sameSnapshot = (a: Snapshot, b: Snapshot) =>
    JSON.stringify(a.colors) === JSON.stringify(b.colors) && a.manual.join() === b.manual.join();

function withCheckpoint(draft: ThemeDraft): ThemeDraft {
    const snapshot = { colors: draft.colors, manual: draft.manual };
    const last = draft.history.at(-1);
    if (last && sameSnapshot(last, snapshot)) return draft;
    return { ...draft, history: [...draft.history, snapshot].slice(-HISTORY_LIMIT) };
}

export function createDraft(initial: {
    name: string;
    colors: ThemeColors;
    manual?: ThemeToken[];
}): ThemeDraft {
    return {
        name: initial.name,
        colors: initial.colors,
        manual: initial.manual ?? [],
        history: [],
    };
}

export function draftReducer(draft: ThemeDraft, action: DraftAction): ThemeDraft {
    switch (action.type) {
        case 'rename':
            return { ...draft, name: action.name };

        case 'checkpoint':
            return withCheckpoint(draft);

        // Main colors drive the rest; any other color set by hand stays as set.
        case 'set': {
            const manual =
                isMainToken(action.token) || draft.manual.includes(action.token)
                    ? draft.manual
                    : [...draft.manual, action.token];
            const colors = rederive(
                { ...draft.colors, [action.token]: action.value },
                [action.token],
                manual,
            );
            return { ...draft, colors, manual };
        }

        case 'auto': {
            const next = withCheckpoint(draft);
            const manual = next.manual.filter((token) => token !== action.token);
            const colors = rederive(
                { ...next.colors, [action.token]: autoColor(action.token, next.colors) },
                [action.token],
                manual,
            );
            return { ...next, colors, manual };
        }

        case 'load':
            return { ...withCheckpoint(draft), colors: action.colors, manual: [] };

        case 'fix': {
            const check = CONTRAST_CHECKS.find((item) => item.id === action.check);
            if (!check) return draft;
            const next = withCheckpoint(draft);
            const colors = rederive(
                { ...next.colors, [check.fg]: fixedColor(check, next.colors) },
                [check.fg],
                next.manual,
            );
            return { ...next, colors };
        }

        case 'fixAll': {
            const next = withCheckpoint(draft);
            return { ...next, colors: fixAll(next.colors, next.manual) };
        }

        case 'undo': {
            // A checkpoint with no edits after it is not a step.
            const history = draft.history.filter(
                (snapshot, i) => i < draft.history.length - 1 || !sameSnapshot(snapshot, draft),
            );
            const previous = history.at(-1);
            if (!previous) return { ...draft, history };
            return { ...draft, ...previous, history: history.slice(0, -1) };
        }
    }
}

export const canUndo = (draft: ThemeDraft) =>
    draft.history.some((snapshot) => !sameSnapshot(snapshot, draft));
