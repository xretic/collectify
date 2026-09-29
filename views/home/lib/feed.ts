export type Feed = { kind: 'for-you' } | { kind: 'explore' } | { kind: 'board'; boardId: number };

const FILTER_PARAMS = ['category', 'tag', 'q', 'sort'];

/**
 * Feed from the URL: signed-in users land on "For you"; filters and tags imply
 * "Explore". Shared by the page (server prefetch) and the client view.
 */
export function resolveFeed(
    get: (key: string) => string | null | undefined,
    signedIn: boolean,
): Feed & { filtered: boolean } {
    const board = Number(get('board'));
    const filtered = FILTER_PARAMS.some((key) => get(key) != null);

    if (!signedIn) return { kind: 'explore', filtered };
    if (Number.isInteger(board) && board > 0) return { kind: 'board', boardId: board, filtered };
    if (get('feed') === 'explore' || filtered) return { kind: 'explore', filtered };

    return { kind: 'for-you', filtered };
}
