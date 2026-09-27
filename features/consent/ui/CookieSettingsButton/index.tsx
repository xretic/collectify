'use client';

import { Button } from '@mui/material';
import { useConsentStore } from '../../model/consentStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Reopens the cookie choices at any time (withdrawing consent is as easy as giving it). */
export function CookieSettingsButton({ variant = 'link' }: { variant?: 'link' | 'button' }) {
    const t = useTranslations('consent');
    const openSettings = useConsentStore((state) => state.openSettings);

    return variant === 'button' ? (
        <Button variant="outlined" onClick={openSettings}>
            {t('settingsTitle')}
        </Button>
    ) : (
        <button type="button" className={styles.link} onClick={openSettings}>
            {t('settingsTitle')}
        </button>
    );
}
