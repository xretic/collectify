'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
    MAX_CUSTOM_THEMES,
    THEMES,
    type ActiveThemeId,
    type CustomTheme,
} from '@/shared/config/themes';
import { useThemeStore } from '@/shared/model/themeStore';
import { toast } from '@/shared/model/toastStore';
import { useHydrated } from '@/shared/lib/hooks/useHydrated';
import { SearchField } from '@/shared/ui/SearchField';
import { decodeTheme, readThemeColors, themeStyle } from '../../lib/palette';
import { THEME_PARAM } from '../../lib/shareUrl';
import { ThemeEditor, type ThemeEditorStart } from '../ThemeEditor';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type Filter = 'all' | 'light' | 'dark';

type Swatch = {
    id: ActiveThemeId;
    name: string;
    scheme: 'light' | 'dark';
    custom?: CustomTheme;
    style?: CSSProperties;
};

type EditorState = { theme?: CustomTheme; start: ThemeEditorStart } | null;

/** A theme shared by link (`/settings?theme=…`), opened once in the editor. */
function readSharedLink(): { present: boolean; editor: EditorState } {
    if (typeof window === 'undefined') return { present: false, editor: null };
    const code = new URLSearchParams(window.location.search).get(THEME_PARAM);
    const shared = code ? decodeTheme(code) : null;
    return {
        present: code !== null,
        editor: shared ? { start: { ...shared, imported: true } } : null,
    };
}

function EditButton({
    theme,
    label,
    onEdit,
}: {
    theme: CustomTheme;
    label: string;
    onEdit: (theme: CustomTheme) => void;
}) {
    return (
        <button
            type="button"
            className={styles.edit}
            style={themeStyle(theme.colors)}
            onClick={() => onEdit(theme)}
            aria-label={label}
            title={label}
        >
            <EditOutlinedIcon fontSize="small" />
        </button>
    );
}

/**
 * Theme gallery. Each preset swatch sets `data-theme` on itself, so it is
 * painted by that theme's own tokens (see app/themes.css); custom themes pass
 * their tokens inline. No colors are duplicated here.
 */
export function ThemePicker() {
    const t = useTranslations('settings.appearance');
    const te = useTranslations('themeEditor');
    // The choice and custom themes live in this browser's storage: the server
    // cannot know them, so the first render matches its default.
    const hydrated = useHydrated();
    const storedTheme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const storedCustomThemes = useThemeStore((state) => state.customThemes);
    const theme = hydrated ? storedTheme : null;
    const customThemes = useMemo(
        () => (hydrated ? storedCustomThemes : []),
        [hydrated, storedCustomThemes],
    );
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sharedLink] = useState(readSharedLink);
    const [editor, setEditor] = useState<EditorState>(sharedLink.editor);

    // The link did its job once the editor is open: a reload must not reopen it.
    useEffect(() => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has(THEME_PARAM)) return;
        if (!sharedLink.editor) toast.error(te('invalidLink'));
        url.searchParams.delete(THEME_PARAM);
        window.history.replaceState(window.history.state, '', url);
    }, [sharedLink, te]);

    const visible = useMemo(() => {
        const needle = search.trim().toLowerCase();
        const swatches: Swatch[] = [
            ...customThemes.map((item) => ({
                id: item.id,
                name: item.name,
                scheme: item.scheme,
                custom: item,
                style: themeStyle(item.colors),
            })),
            ...THEMES.map((item) => ({ id: item.id, name: item.name, scheme: item.scheme })),
        ];
        return swatches.filter(
            (item) =>
                (filter === 'all' || item.scheme === filter) &&
                item.name.toLowerCase().includes(needle),
        );
    }, [customThemes, filter, search]);

    const create = () => {
        if (customThemes.length >= MAX_CUSTOM_THEMES) {
            toast.error(te('limit', { max: MAX_CUSTOM_THEMES }));
            return;
        }
        // Starts as a copy of the theme in use, so tweaking it is the natural first step.
        const current = customThemes.find((item) => item.id === storedTheme);
        setEditor({
            start: { name: '', colors: current?.colors ?? readThemeColors(storedTheme) },
        });
    };

    return (
        <div className={styles.picker}>
            <div className={styles.toolbar}>
                <SearchField value={search} onChange={setSearch} placeholder={t('search')} />

                <div className={styles.filters} role="group" aria-label={t('filter')}>
                    {(['all', 'light', 'dark'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.filter} ${filter === value ? styles.filterActive : ''}`}
                            onClick={() => setFilter(value)}
                            aria-pressed={filter === value}
                        >
                            {t(`filters.${value}`)}
                        </button>
                    ))}
                </div>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={create}
                    className={styles.create}
                >
                    {te('create')}
                </Button>
            </div>

            <div className={styles.grid} role="radiogroup" aria-label={t('theme')}>
                {visible.map((item) => (
                    <div key={item.id} className={styles.tile}>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={item.id === theme}
                            data-theme={item.custom ? undefined : item.id}
                            style={item.style}
                            className={`${styles.swatch} ${item.custom ? styles.customSwatch : ''} ${item.id === theme ? styles.selected : ''}`}
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

                        {item.custom && (
                            <EditButton
                                theme={item.custom}
                                label={te('editNamed', { name: item.name })}
                                onEdit={(custom) =>
                                    setEditor({
                                        theme: custom,
                                        start: { name: custom.name, colors: custom.colors },
                                    })
                                }
                            />
                        )}
                    </div>
                ))}
            </div>

            {hydrated && editor && (
                <ThemeEditor
                    theme={editor.theme}
                    start={editor.start}
                    onClose={() => setEditor(null)}
                />
            )}
        </div>
    );
}
