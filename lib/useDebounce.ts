import { useEffect, useState } from 'react';
import { DEFAULT_DEBOUNCE_DELAY } from './constans';

export function useDebounce<T>(value: T, delay = DEFAULT_DEBOUNCE_DELAY): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timeout);
    }, [value, delay]);

    return debouncedValue;
}
