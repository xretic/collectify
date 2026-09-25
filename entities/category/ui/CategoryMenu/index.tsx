'use client';

import { useMemo, useState, type MouseEvent } from 'react';
import { InputAdornment, ListSubheader, Menu, MenuItem, TextField } from '@mui/material';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchIcon from '@mui/icons-material/Search';
import { useCategories } from '../../model/useCategories';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type CategoryMenuProps = {
    /** Selected category slug; `undefined` means all categories. */
    value: string | undefined;
    onChange: (slug: string | undefined) => void;
};

/** Filter control: a button that opens a searchable list of categories. */
export function CategoryMenu({ value, onChange }: CategoryMenuProps) {
    const t = useTranslations('categoryMenu');
    const { categories, bySlug } = useCategories();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [search, setSearch] = useState('');

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return needle
            ? categories.filter((category) => category.name.toLowerCase().includes(needle))
            : categories;
    }, [categories, search]);

    const close = () => {
        setAnchorEl(null);
        setSearch('');
    };

    const select = (slug: string | undefined) => {
        onChange(slug);
        close();
    };

    const selected = value ? bySlug.get(value) : undefined;

    return (
        <>
            <button
                type="button"
                className={`${styles.trigger} ${selected ? styles.active : ''}`}
                onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                aria-haspopup="menu"
            >
                <CategoryOutlinedIcon fontSize="small" />
                <span className={styles.label}>{selected?.name ?? t('all')}</span>
                <KeyboardArrowDownIcon fontSize="small" />
            </button>

            <Menu
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={close}
                classes={{ paper: styles.menu }}
                autoFocus={false}
            >
                <ListSubheader className={styles.search}>
                    <TextField
                        size="small"
                        fullWidth
                        autoFocus
                        placeholder={t('search')}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        // Typing must not trigger the menu's first-letter navigation.
                        onKeyDown={(event) => event.key !== 'Escape' && event.stopPropagation()}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </ListSubheader>

                {!search && (
                    <MenuItem selected={!value} onClick={() => select(undefined)}>
                        <span className={styles.item}>{t('all')}</span>
                        {!value && <CheckIcon fontSize="small" />}
                    </MenuItem>
                )}

                {visible.map((category) => (
                    <MenuItem
                        key={category.id}
                        selected={category.slug === value}
                        onClick={() => select(category.slug)}
                    >
                        <span className={styles.item}>{category.name}</span>
                        {category.slug === value && <CheckIcon fontSize="small" />}
                    </MenuItem>
                ))}

                {visible.length === 0 && (
                    <MenuItem disabled>
                        <span className={styles.item}>{t('nothingFound')}</span>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}
