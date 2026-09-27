'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * `?token=` of an emailed link, read once and then removed from the address
 * bar, so it does not linger in history, screenshots or shared URLs.
 */
export function useUrlToken() {
    const searchParams = useSearchParams();
    const [token] = useState(() => searchParams.get('token'));

    useEffect(() => {
        if (!searchParams.has('token')) return;

        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState(null, '', url);
    }, [searchParams]);

    return token;
}
