'use client';

import { Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useTranslations } from 'next-intl';
import type { ThemeColors, ThemeToken } from '@/shared/config/themes';
import { CONTRAST_CHECKS, passes, ratioOf, type ContrastCheck } from '../../lib/palette';
import styles from './ReadabilityPanel.module.css';

type ReadabilityPanelProps = {
    colors: ThemeColors;
    onFix: (check: ContrastCheck['id']) => void;
    onFixAll: () => void;
    onHighlight: (token: ThemeToken | null) => void;
};

/** WCAG AA contrast of every text and icon color, with the smallest fix for each. */
export function ReadabilityPanel({ colors, onFix, onFixAll, onHighlight }: ReadabilityPanelProps) {
    const t = useTranslations('themeEditor');
    const failing = CONTRAST_CHECKS.filter((check) => !passes(check, colors)).length;

    return (
        <section className={styles.panel} aria-labelledby="theme-readability">
            <div className={styles.header}>
                <div>
                    <h3 id="theme-readability" className={styles.title}>
                        {t('readability')}
                    </h3>
                    <p className={styles.hint}>{t('readabilityHint')}</p>
                </div>
                {failing > 0 && (
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AutoFixHighIcon />}
                        onClick={onFixAll}
                        className={styles.fixAll}
                    >
                        {t('fixAll')}
                    </Button>
                )}
            </div>

            <p className={failing ? styles.summaryBad : styles.summaryGood} role="status">
                {failing ? <WarningAmberIcon /> : <CheckCircleIcon />}
                {failing ? t('problems', { count: failing }) : t('allGood')}
            </p>

            <ul className={styles.list}>
                {CONTRAST_CHECKS.map((check) => {
                    const ok = passes(check, colors);
                    const ratio = ratioOf(check, colors);
                    return (
                        <li
                            key={check.id}
                            className={styles.item}
                            onMouseEnter={() => onHighlight(check.fg)}
                            onMouseLeave={() => onHighlight(null)}
                        >
                            {ok ? (
                                <CheckCircleIcon className={styles.ok} aria-label={t('passes')} />
                            ) : (
                                <WarningAmberIcon className={styles.bad} aria-label={t('fails')} />
                            )}
                            <span className={styles.name}>{t(`checks.${check.id}`)}</span>
                            <span
                                className={styles.ratio}
                                title={t('ratioTitle', { min: check.min })}
                            >
                                {(Math.floor(ratio * 10) / 10).toFixed(1)}:1
                            </span>
                            {!ok && (
                                <Button size="small" onClick={() => onFix(check.id)}>
                                    {t('fix')}
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
