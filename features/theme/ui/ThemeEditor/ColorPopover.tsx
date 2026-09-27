'use client';

import { Button, IconButton, Popover, Tooltip } from '@mui/material';
import ColorizeIcon from '@mui/icons-material/Colorize';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { useTranslations } from 'next-intl';
import styles from './ColorPopover.module.css';

type EyeDropperApi = { open: () => Promise<{ sRGBHex: string }> };
type EyeDropperWindow = Window & { EyeDropper?: new () => EyeDropperApi };

type ColorPopoverProps = {
    anchor: HTMLElement | null;
    label: string;
    value: string;
    /** Other colors of the theme, one click away. */
    swatches: string[];
    /** Set for colors that can follow the others but were set by hand. */
    onAuto?: () => void;
    onChange: (value: string) => void;
    onClose: () => void;
};

export function ColorPopover({
    anchor,
    label,
    value,
    swatches,
    onAuto,
    onChange,
    onClose,
}: ColorPopoverProps) {
    const t = useTranslations('themeEditor');
    const EyeDropper =
        typeof window === 'undefined' ? undefined : (window as EyeDropperWindow).EyeDropper;

    const pickFromScreen = async () => {
        if (!EyeDropper) return;
        try {
            const { sRGBHex } = await new EyeDropper().open();
            onChange(sRGBHex.toLowerCase());
        } catch {
            // Cancelled with Escape.
        }
    };

    return (
        <Popover
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{ paper: { className: styles.paper } }}
        >
            <p className={styles.title}>{label}</p>

            <HexColorPicker color={value} onChange={onChange} className={styles.picker} />

            <div className={styles.inputRow}>
                <span className={styles.current} style={{ backgroundColor: value }} />
                <HexColorInput
                    color={value}
                    onChange={(hex) => onChange(hex.toLowerCase())}
                    prefixed
                    aria-label={t('hex')}
                    className={styles.input}
                />
                {EyeDropper && (
                    <Tooltip title={t('eyedropper')}>
                        <IconButton onClick={pickFromScreen} aria-label={t('eyedropper')}>
                            <ColorizeIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </div>

            {swatches.length > 0 && (
                <div>
                    <p className={styles.caption}>{t('fromTheme')}</p>
                    <div className={styles.swatches}>
                        {swatches.map((swatch) => (
                            <button
                                key={swatch}
                                type="button"
                                className={`${styles.swatch} ${swatch === value ? styles.swatchActive : ''}`}
                                style={{ backgroundColor: swatch }}
                                onClick={() => onChange(swatch)}
                                aria-label={swatch}
                                title={swatch}
                            />
                        ))}
                    </div>
                </div>
            )}

            {onAuto && (
                <Button startIcon={<AutoFixHighIcon />} onClick={onAuto} size="small">
                    {t('resetToAuto')}
                </Button>
            )}
        </Popover>
    );
}
