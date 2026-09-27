'use client';

import { useMemo, useReducer, useRef, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    IconButton,
    TextField,
    Tooltip,
} from '@mui/material';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UndoIcon from '@mui/icons-material/Undo';
import LinkIcon from '@mui/icons-material/Link';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import {
    CUSTOM_THEME_NAME_MAX_LENGTH,
    MAX_CUSTOM_THEMES,
    THEME_TOKENS,
    THEMES,
    type CustomTheme,
    type ThemeColors,
    type ThemeToken,
} from '@/shared/config/themes';
import { useThemeStore } from '@/shared/model/themeStore';
import { copyText } from '@/shared/lib/copyText';
import { toast } from '@/shared/model/toastStore';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { ScrollRow } from '@/shared/ui/ScrollRow';
import {
    encodeTheme,
    isDerivable,
    isMainToken,
    MAIN_TOKENS,
    randomColors,
    readThemeColors,
    schemeOf,
    themeStyle,
} from '../../lib/palette';
import { canUndo, createDraft, draftReducer } from '../../model/themeDraft';
import { themeShareUrl } from '../../lib/shareUrl';
import { TOKEN_KEYS } from '../../lib/tokenKeys';
import { ColorPopover } from './ColorPopover';
import { ReadabilityPanel } from './ReadabilityPanel';
import { ThemePreview } from './ThemePreview';
import styles from './index.module.css';

const SECONDARY_TOKENS = THEME_TOKENS.filter((token) => !isMainToken(token));

export type ThemeEditorStart = {
    name: string;
    colors: ThemeColors;
    /** Opened from a shared link rather than by the user. */
    imported?: boolean;
};

type ThemeEditorProps = {
    /** The custom theme to edit; a new one is created when missing. */
    theme?: CustomTheme;
    start: ThemeEditorStart;
    onClose: () => void;
};

const newThemeId = (): CustomTheme['id'] =>
    `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Theme editor: three main colors that everything else follows, every color
 * tweakable on its own, a live preview (click a part to recolor it) and a
 * readability check with one-click fixes.
 */
export function ThemeEditor({ theme, start, onClose }: ThemeEditorProps) {
    const t = useTranslations('themeEditor');
    const tc = useTranslations('common');
    const customThemes = useThemeStore((state) => state.customThemes);
    const saveCustomTheme = useThemeStore((state) => state.saveCustomTheme);
    const deleteCustomTheme = useThemeStore((state) => state.deleteCustomTheme);

    const [draft, dispatch] = useReducer(
        draftReducer,
        {
            name: theme?.name ?? start.name,
            colors: theme?.colors ?? start.colors,
            manual: theme?.manual,
        },
        createDraft,
    );
    const [initial] = useState(draft);
    const [picking, setPicking] = useState<{ token: ThemeToken; anchor: HTMLElement } | null>(null);
    const [highlight, setHighlight] = useState<ThemeToken | null>(null);
    const [expanded, setExpanded] = useState(Boolean(theme?.manual?.length));
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const anchors = useRef(new Map<ThemeToken, HTMLElement>());

    const dirty =
        draft.name !== initial.name ||
        JSON.stringify(draft.colors) !== JSON.stringify(initial.colors);
    const label = (token: ThemeToken) => t(`tokens.${TOKEN_KEYS[token]}.label`);
    const hint = (token: ThemeToken) => t(`tokens.${TOKEN_KEYS[token]}.hint`);

    const swatches = useMemo(() => [...new Set(Object.values(draft.colors))], [draft.colors]);

    const startFrom = useMemo(
        () => [
            ...customThemes
                .filter((item) => item.id !== theme?.id)
                .map((item) => ({ id: item.id, name: item.name, style: themeStyle(item.colors) })),
            ...THEMES.map((item) => ({ id: item.id, name: item.name, style: undefined })),
        ],
        [customThemes, theme?.id],
    );

    const openPicker = (token: ThemeToken, anchor: HTMLElement) => {
        dispatch({ type: 'checkpoint' });
        setPicking({ token, anchor });
    };

    // From the preview: bring the color's control into view, then open it.
    const pickFromPreview = (token: ThemeToken) => {
        if (!isMainToken(token)) setExpanded(true);
        requestAnimationFrame(() => {
            const anchor = anchors.current.get(token);
            if (!anchor) return;
            anchor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            openPicker(token, anchor);
        });
    };

    const loadTheme = (id: string) => {
        const custom = customThemes.find((item) => item.id === id);
        dispatch({ type: 'load', colors: custom?.colors ?? readThemeColors(id) });
    };

    const handleClose = (_: unknown, reason?: 'backdropClick' | 'escapeKeyDown') => {
        // A stray click outside must not throw the work away.
        if (dirty && reason) return;
        onClose();
    };

    const save = () => {
        if (!theme && customThemes.length >= MAX_CUSTOM_THEMES) {
            toast.error(t('limit', { max: MAX_CUSTOM_THEMES }));
            return;
        }
        saveCustomTheme({
            id: theme?.id ?? newThemeId(),
            name: draft.name.trim() || t('untitled'),
            scheme: schemeOf(draft.colors),
            colors: draft.colors,
            manual: draft.manual,
        });
        toast.success(t('saved'));
        onClose();
    };

    const share = async () => {
        const url = themeShareUrl(encodeTheme(draft.name.trim(), draft.colors));
        if (await copyText(url)) toast.success(t('linkCopied'));
        else toast.error(t('copyFailed'));
    };

    const remove = () => {
        if (theme) deleteCustomTheme(theme.id);
        onClose();
    };

    const registerAnchor = (token: ThemeToken) => (element: HTMLElement | null) => {
        if (element) anchors.current.set(token, element);
        else anchors.current.delete(token);
    };

    const hoverProps = (token: ThemeToken) => ({
        onMouseEnter: () => setHighlight(token),
        onMouseLeave: () => setHighlight(null),
        onFocus: () => setHighlight(token),
        onBlur: () => setHighlight(null),
    });

    return (
        <Dialog
            open
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
            slotProps={{ paper: { className: styles.paper } }}
            aria-labelledby="theme-editor-title"
        >
            <DialogTitle id="theme-editor-title" className={styles.header}>
                {theme ? t('editTitle') : t('createTitle')}
                <IconButton onClick={onClose} aria-label={tc('close')} className={styles.close}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <div className={styles.layout}>
                <div className={styles.previewColumn}>
                    <p className={styles.previewHint}>{t('previewHint')}</p>
                    <ThemePreview
                        colors={draft.colors}
                        highlight={highlight}
                        onPick={pickFromPreview}
                    />
                </div>

                <div className={styles.controls}>
                    {start.imported && !theme && <p className={styles.notice}>{t('imported')}</p>}

                    <TextField
                        label={t('name')}
                        placeholder={t('untitled')}
                        value={draft.name}
                        onChange={(event) => dispatch({ type: 'rename', name: event.target.value })}
                        slotProps={{
                            htmlInput: { maxLength: CUSTOM_THEME_NAME_MAX_LENGTH },
                            inputLabel: { shrink: true },
                        }}
                        fullWidth
                    />

                    <section className={styles.group}>
                        <h3 className={styles.groupTitle}>{t('startFrom')}</h3>
                        <ScrollRow itemsLabel={t('startFrom')} className={styles.presets}>
                            <button
                                type="button"
                                className={`${styles.preset} ${styles.random}`}
                                onClick={() => dispatch({ type: 'load', colors: randomColors() })}
                            >
                                <CasinoOutlinedIcon fontSize="small" />
                                {t('random')}
                            </button>
                            {startFrom.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={styles.preset}
                                    data-theme={item.style ? undefined : item.id}
                                    style={item.style}
                                    onClick={() => loadTheme(item.id)}
                                >
                                    <span className={styles.presetDot} aria-hidden />
                                    {item.name}
                                </button>
                            ))}
                        </ScrollRow>
                    </section>

                    <section className={styles.group}>
                        <h3 className={styles.groupTitle}>{t('mainColors')}</h3>
                        <p className={styles.groupHint}>{t('mainColorsHint')}</p>
                        <div className={styles.mainColors}>
                            {MAIN_TOKENS.map((token) => (
                                <button
                                    key={token}
                                    ref={registerAnchor(token)}
                                    type="button"
                                    className={styles.mainColor}
                                    onClick={(event) => openPicker(token, event.currentTarget)}
                                    {...hoverProps(token)}
                                >
                                    <span
                                        className={styles.mainSwatch}
                                        style={{ backgroundColor: draft.colors[token] }}
                                    />
                                    <span className={styles.mainLabel}>{label(token)}</span>
                                    <span className={styles.hex}>{draft.colors[token]}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className={styles.group}>
                        <button
                            type="button"
                            className={styles.expand}
                            onClick={() => setExpanded((value) => !value)}
                            aria-expanded={expanded}
                            aria-controls="theme-editor-all-colors"
                        >
                            <span>
                                <span className={styles.groupTitle}>{t('allColors')}</span>
                                <span className={styles.groupHint}>{t('allColorsHint')}</span>
                            </span>
                            <ExpandMoreIcon
                                className={expanded ? styles.expandIconOpen : styles.expandIcon}
                            />
                        </button>

                        <ul id="theme-editor-all-colors" className={styles.rows} hidden={!expanded}>
                            {SECONDARY_TOKENS.map((token) => {
                                const manual = draft.manual.includes(token);
                                return (
                                    <li key={token}>
                                        <button
                                            ref={registerAnchor(token)}
                                            type="button"
                                            className={styles.row}
                                            onClick={(event) =>
                                                openPicker(token, event.currentTarget)
                                            }
                                            {...hoverProps(token)}
                                        >
                                            <span
                                                className={styles.rowSwatch}
                                                style={{ backgroundColor: draft.colors[token] }}
                                            />
                                            <span className={styles.rowText}>
                                                <span>{label(token)}</span>
                                                <span className={styles.rowHint}>
                                                    {hint(token)}
                                                </span>
                                            </span>
                                            {isDerivable(token) && (
                                                <span
                                                    className={
                                                        manual
                                                            ? styles.badgeManual
                                                            : styles.badgeAuto
                                                    }
                                                >
                                                    {manual ? t('manual') : t('auto')}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <ReadabilityPanel
                        colors={draft.colors}
                        onFix={(check) => dispatch({ type: 'fix', check })}
                        onFixAll={() => dispatch({ type: 'fixAll' })}
                        onHighlight={setHighlight}
                    />
                </div>
            </div>

            <DialogActions className={styles.actions}>
                <div className={styles.secondaryActions}>
                    <Tooltip title={t('undo')}>
                        <span>
                            <IconButton
                                onClick={() => dispatch({ type: 'undo' })}
                                disabled={!canUndo(draft)}
                                aria-label={t('undo')}
                            >
                                <UndoIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={t('share')}>
                        <IconButton onClick={share} aria-label={t('share')}>
                            <LinkIcon />
                        </IconButton>
                    </Tooltip>
                    {theme && (
                        <Tooltip title={t('delete')}>
                            <IconButton
                                onClick={() => setConfirmingDelete(true)}
                                aria-label={t('delete')}
                                className={styles.delete}
                            >
                                <DeleteOutlineIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </div>
                <Button onClick={onClose} className={styles.cancel}>
                    {tc('cancel')}
                </Button>
                <Button variant="contained" onClick={save} className={styles.save}>
                    {t('save')}
                </Button>
            </DialogActions>

            {picking && (
                <ColorPopover
                    anchor={picking.anchor}
                    label={label(picking.token)}
                    value={draft.colors[picking.token]}
                    swatches={swatches}
                    onAuto={
                        isDerivable(picking.token) && draft.manual.includes(picking.token)
                            ? () => dispatch({ type: 'auto', token: picking.token })
                            : undefined
                    }
                    onChange={(value) => dispatch({ type: 'set', token: picking.token, value })}
                    onClose={() => setPicking(null)}
                />
            )}

            <ConfirmDialog
                open={confirmingDelete}
                title={t('deleteTitle', { name: theme?.name ?? '' })}
                description={t('deleteDescription')}
                confirmLabel={tc('delete')}
                destructive
                onConfirm={remove}
                onClose={() => setConfirmingDelete(false)}
            />
        </Dialog>
    );
}
