'use client';

import { useSyncExternalStore } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useSearchDialogStore } from '@/widgets/global-search/model/searchDialogStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const subscribeNever = () => () => {};
const platformShortcut = () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K');

/** Looks like a search field; opens the search dialog. */
export function SearchTrigger({ className }: { className?: string }) {
    const t = useTranslations('search');
    const show = useSearchDialogStore((state) => state.show);
    // The hint depends on the platform, which the server cannot know: none until hydrated.
    const shortcut = useSyncExternalStore(subscribeNever, platformShortcut, () => null);

    return (
        <button
            type="button"
            className={`${styles.trigger} ${className ?? ''}`}
            onClick={show}
            aria-haspopup="dialog"
            aria-keyshortcuts="Meta+K Control+K"
        >
            <SearchIcon fontSize="small" />
            <span className={styles.label}>{t('open')}</span>
            {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
        </button>
    );
}
