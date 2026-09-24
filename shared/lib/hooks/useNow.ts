import { useEffect, useState } from 'react';

/** Current timestamp that refreshes every `intervalMs` (for relative times). */
export function useNow(intervalMs = 30_000) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return now;
}
