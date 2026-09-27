const KEY = 'collectify:recent-searches';
const LIMIT = 6;

/** The last queries that led somewhere, newest first (this browser only). */
export function readRecentSearches(): string[] {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) ?? '[]');
        return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
    } catch {
        return [];
    }
}

export function saveRecentSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const next = [trimmed, ...readRecentSearches().filter((item) => item !== trimmed)].slice(
        0,
        LIMIT,
    );

    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        // Storage blocked: nothing to remember.
    }
}

export function clearRecentSearches() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        // Nothing to clear.
    }
}
