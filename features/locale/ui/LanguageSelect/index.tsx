'use client';

import { MenuItem, TextField } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslations } from 'next-intl';
import { LOCALE_NAMES, LOCALES, type Locale } from '@/shared/config/i18n';
import { useChangeLocale } from '../../model/useChangeLocale';
import styles from './index.module.css';

type LanguageSelectProps = {
    size?: 'small' | 'medium';
    fullWidth?: boolean;
    helperText?: string;
    /** No floating label: a small inline control (footer). */
    compact?: boolean;
};

/**
 * Language dropdown that switches the whole UI right away. Each language is
 * listed in its own name plus the current UI language ("Deutsch · German").
 */
export function LanguageSelect({
    size = 'medium',
    fullWidth,
    helperText,
    compact = false,
}: LanguageSelectProps) {
    const t = useTranslations('languages');
    const { locale, changeLocale, pending } = useChangeLocale();
    const displayNames = new Intl.DisplayNames([locale], { type: 'language' });

    return (
        <TextField
            select
            size={size}
            fullWidth={fullWidth}
            label={compact ? undefined : t('label')}
            value={locale}
            onChange={(event) => changeLocale(event.target.value as Locale)}
            disabled={pending}
            helperText={helperText}
            className={compact ? styles.compact : fullWidth ? undefined : styles.field}
            slotProps={{
                htmlInput: { 'aria-label': t('label') },
                select: {
                    renderValue: (value) => (
                        <span className={styles.value}>
                            <TranslateIcon className={styles.icon} />
                            {LOCALE_NAMES[value as Locale]}
                        </span>
                    ),
                },
            }}
        >
            {LOCALES.map((code) => (
                <MenuItem key={code} value={code} lang={code} className={styles.option}>
                    <span>{LOCALE_NAMES[code]}</span>
                    {code !== locale && (
                        <span className={styles.translated}>{displayNames.of(code)}</span>
                    )}
                </MenuItem>
            ))}
        </TextField>
    );
}
