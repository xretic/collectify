'use client';

import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Avatar, CircularProgress, Dialog, IconButton, InputBase } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import TagIcon from '@mui/icons-material/Tag';
import { useCategories } from '@/entities/category/model/useCategories';
import { useCategoryName } from '@/entities/category/model/useCategoryName';
import { searchApi } from '@/features/search/api/searchApi';
import { SEARCH_QUERY_MAX_LENGTH, type SearchResults } from '@/features/search/model/types';
import { useDebounce } from '@/shared/lib/hooks/useDebounce';
import { useSearchDialogStore } from '../../model/searchDialogStore';
import {
    clearRecentSearches,
    readRecentSearches,
    saveRecentSearch,
} from '../../lib/recentSearches';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type Section = 'collections' | 'tags' | 'users' | 'all';

/** One row the keyboard can move to; `index` is its position across all sections. */
type Entry = { key: string; section: Section; href: string; index: number };

const explorePath = (query: string) => `/?q=${encodeURIComponent(query)}`;

function toEntries(results: SearchResults | undefined, query: string): Entry[] {
    if (!query) return [];

    const rows: Omit<Entry, 'index'>[] = [
        ...(results?.collections ?? []).map((collection) => ({
            key: `c${collection.id}`,
            section: 'collections' as const,
            href: `/collections/${collection.id}`,
        })),
        ...(results?.tags ?? []).map((tag) => ({
            key: `t${tag.id}`,
            section: 'tags' as const,
            href: `/?tag=${tag.id}`,
        })),
        ...(results?.users ?? []).map((user) => ({
            key: `u${user.id}`,
            section: 'users' as const,
            href: `/users/${user.id}`,
        })),
        { key: 'all', section: 'all', href: explorePath(query) },
    ];

    return rows.map((row, index) => ({ ...row, index }));
}

const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** ⌘K / Ctrl+K anywhere; "/" too, except while typing and in chats (it is a character there). */
function useSearchShortcut(show: () => void) {
    const pathname = usePathname();

    useEffect(() => {
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            const modifier = event.metaKey || event.ctrlKey;

            if (modifier && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                show();
            } else if (
                event.key === '/' &&
                !modifier &&
                !event.altKey &&
                !isTyping(event.target) &&
                !pathname.startsWith('/chats')
            ) {
                event.preventDefault();
                show();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [show, pathname]);
}

/** Spotlight-style search over collections, tags and people. */
export function GlobalSearch() {
    const t = useTranslations('search');
    const router = useRouter();
    const { open, show, close } = useSearchDialogStore();
    const categoryName = useCategoryName();
    const { categories } = useCategories();
    const [input, setInput] = useState('');
    const [active, setActive] = useState(0);
    const [recent, setRecent] = useState<string[]>([]);
    const query = useDebounce(input.trim(), 200);

    useSearchShortcut(show);

    const results = useQuery({
        queryKey: ['global-search', query],
        queryFn: ({ signal }) => searchApi.search(query, signal),
        enabled: open && query.length > 0,
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });

    const categoryById = useMemo(
        () => new Map(categories.map((category) => [category.id, category.name])),
        [categories],
    );

    const data = query ? results.data : undefined;
    const entries = useMemo(() => toEntries(data, query), [data, query]);
    const bySection = (section: Section) => entries.filter((entry) => entry.section === section);
    const nothingFound =
        data && !data.collections.length && !data.tags.length && !data.users.length;

    const reset = () => {
        setInput('');
        setActive(0);
        setRecent(readRecentSearches());
    };

    const go = (href: string) => {
        if (query) saveRecentSearch(query);
        close();
        router.push(href);
    };

    const follow = (href: string) => (event: MouseEvent) => {
        // Plain clicks go through `go` (remember the query, close); new-tab clicks stay native.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        go(href);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setActive((index) => Math.min(Math.max(index + step, 0), entries.length - 1));
        } else if (event.key === 'Enter' && query) {
            event.preventDefault();
            go(entries[active]?.href ?? explorePath(query));
        }
    };

    const rowProps = (entry: Entry) => ({
        href: entry.href,
        onClick: follow(entry.href),
        onMouseMove: () => setActive(entry.index),
        className: `${styles.row} ${entry.index === active ? styles.active : ''}`,
        'aria-selected': entry.index === active,
        role: 'option',
        id: `search-${entry.key}`,
    });

    const collectionRows = bySection('collections');
    const tagRows = bySection('tags');
    const userRows = bySection('users');
    const allRow = bySection('all')[0];

    return (
        <Dialog
            open={open}
            onClose={close}
            classes={{ container: styles.container, paper: styles.paper }}
            slotProps={{ transition: { onEnter: reset } }}
            aria-label={t('open')}
        >
            <div className={styles.field}>
                <SearchIcon className={styles.fieldIcon} />
                <InputBase
                    autoFocus
                    fullWidth
                    value={input}
                    onChange={(event) => {
                        setInput(event.target.value);
                        setActive(0);
                    }}
                    onKeyDown={onKeyDown}
                    placeholder={t('placeholder')}
                    inputProps={{
                        maxLength: SEARCH_QUERY_MAX_LENGTH,
                        role: 'combobox',
                        'aria-expanded': entries.length > 0,
                        'aria-controls': 'global-search-results',
                        'aria-activedescendant': entries[active]
                            ? `search-${entries[active].key}`
                            : undefined,
                        enterKeyHint: 'search',
                    }}
                    className={styles.input}
                />
                {results.isFetching && <CircularProgress size={18} />}
                <IconButton onClick={close} aria-label={t('close')} className={styles.close}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </div>

            <div className={styles.body} id="global-search-results" role="listbox">
                {!query && (
                    <>
                        {recent.length > 0 && (
                            <section className={styles.section}>
                                <header className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>{t('recent')}</h3>
                                    <button
                                        type="button"
                                        className={styles.clear}
                                        onClick={() => {
                                            clearRecentSearches();
                                            setRecent([]);
                                        }}
                                    >
                                        {t('clearRecent')}
                                    </button>
                                </header>
                                <div className={styles.chips}>
                                    {recent.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            className={styles.chip}
                                            onClick={() => setInput(item)}
                                        >
                                            <HistoryIcon fontSize="inherit" />
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {categories.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('categories')}</h3>
                                <div className={styles.chips}>
                                    {categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            href={`/?category=${category.slug}`}
                                            onClick={follow(`/?category=${category.slug}`)}
                                            className={styles.chip}
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        <p className={styles.hint}>{t('hint')}</p>
                    </>
                )}

                {query && collectionRows.length > 0 && data && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{t('sections.collections')}</h3>
                        {collectionRows.map((entry, i) => {
                            const collection = data.collections[i];
                            return (
                                <Link key={entry.key} {...rowProps(entry)}>
                                    <img
                                        className={styles.thumb}
                                        src={collection.bannerUrl}
                                        alt=""
                                        loading="lazy"
                                    />
                                    <span className={styles.text}>
                                        <span className={styles.primary}>{collection.name}</span>
                                        <span className={styles.secondary}>
                                            {categoryName(collection.category)}
                                            {collection.author &&
                                                ` · ${collection.author.fullName}`}
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </section>
                )}

                {query && tagRows.length > 0 && data && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{t('sections.tags')}</h3>
                        {tagRows.map((entry, i) => {
                            const tag = data.tags[i];
                            const category = categoryById.get(tag.categoryId);
                            return (
                                <Link key={entry.key} {...rowProps(entry)}>
                                    <span className={styles.tagIcon}>
                                        <TagIcon fontSize="small" />
                                    </span>
                                    <span className={styles.text}>
                                        <span className={styles.primary}>{tag.name}</span>
                                        <span className={styles.secondary}>
                                            {category && `${category} · `}
                                            {t('tagCount', { count: tag.usageCount })}
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </section>
                )}

                {query && userRows.length > 0 && data && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{t('sections.people')}</h3>
                        {userRows.map((entry, i) => {
                            const user = data.users[i];
                            return (
                                <Link key={entry.key} {...rowProps(entry)}>
                                    <Avatar src={user.avatarUrl} alt="" className={styles.avatar} />
                                    <span className={styles.text}>
                                        <span className={styles.primary}>{user.fullName}</span>
                                        <span className={styles.secondary}>@{user.username}</span>
                                    </span>
                                </Link>
                            );
                        })}
                    </section>
                )}

                {query && nothingFound && <p className={styles.empty}>{t('nothing', { query })}</p>}

                {query && allRow && (
                    <Link {...rowProps(allRow)}>
                        <span className={styles.tagIcon}>
                            <SearchIcon fontSize="small" />
                        </span>
                        <span className={styles.primary}>{t('showAll', { query })}</span>
                    </Link>
                )}
            </div>
        </Dialog>
    );
}
