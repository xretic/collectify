'use client';

import { useMemo, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { THEMES } from '@/shared/config/themes';
import { useThemeStore } from '@/shared/model/themeStore';
import { SearchField } from '@/shared/ui/SearchField';
import styles from './index.module.css';

type Filter = 'all' | 'light' | 'dark';

/**
 * Theme gallery. Each swatch sets `data-theme` on itself, so it is painted by
 * that theme's own tokens (see app/themes.css) — no colors duplicated here.
 */
export function ThemePicker() {
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return THEMES.filter(
            (item) =>
                (filter === 'all' || item.scheme === filter) &&
                item.name.toLowerCase().includes(needle),
        );
    }, [filter, search]);

    return (
        <div className={styles.picker}>
            <div className={styles.toolbar}>
                <SearchField value={search} onChange={setSearch} placeholder="Find a theme" />

                <div className={styles.filters} role="group" aria-label="Filter themes">
                    {(['all', 'light', 'dark'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.filter} ${filter === value ? styles.filterActive : ''}`}
                            onClick={() => setFilter(value)}
                            aria-pressed={filter === value}
                        >
                            {value === 'all' ? 'All' : value === 'light' ? 'Light' : 'Dark'}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.grid} role="radiogroup" aria-label="Theme">
                {visible.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={item.id === theme}
                        data-theme={item.id}
                        className={`${styles.swatch} ${item.id === theme ? styles.selected : ''}`}
                        onClick={() => setTheme(item.id)}
                    >
                        <span className={styles.name}>{item.name}</span>
                        <span className={styles.dots} aria-hidden>
                            <span className={`${styles.dot} ${styles.accent}`} />
                            <span className={`${styles.dot} ${styles.text}`} />
                            <span className={`${styles.dot} ${styles.soft}`} />
                        </span>
                        {item.id === theme && <CheckIcon className={styles.check} />}
                    </button>
                ))}
            </div>
        </div>
    );
}
