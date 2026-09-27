/**
 * A post-sign-in redirect target: only same-site relative paths are allowed
 * ("//evil.com" and "/\evil.com" are protocol-relative URLs), anything else
 * falls back to the home page. Prevents open redirects.
 */
export function safeNextPath(value: string | null | undefined): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
        return '/';
    }
    return value;
}

/** `path` with `?next=` appended, unless the target is the home page anyway. */
export function withNext(path: string, next: string) {
    const target = safeNextPath(next);
    return target === '/' ? path : `${path}?next=${encodeURIComponent(target)}`;
}
