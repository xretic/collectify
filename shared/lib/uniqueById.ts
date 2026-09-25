/** Keeps the first item per `id`; offset pages can overlap when the ranking shifts between requests. */
export function uniqueById<T extends { id: number | string }>(items: T[]): T[] {
    const seen = new Set<T['id']>();
    return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
}
