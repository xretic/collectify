'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    OPTIONAL_CATEGORIES,
    useConsentStore,
    type ConsentCategory,
} from '../../model/consentStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Cookie settings: necessary ones (always on) and each optional category as a switch, off by default. */
export function ConsentDialog() {
    const t = useTranslations('consent');
    const { settingsOpen, choices, decide, closeSettings } = useConsentStore();
    const [draft, setDraft] = useState(choices);

    const toggle = (category: ConsentCategory, value: boolean) =>
        setDraft((current) => ({ ...current, [category]: value }));

    return (
        <Dialog
            open={settingsOpen}
            onClose={closeSettings}
            maxWidth="xs"
            fullWidth
            slotProps={{ transition: { onEnter: () => setDraft(choices) } }}
        >
            <DialogTitle>{t('settingsTitle')}</DialogTitle>
            <DialogContent className={styles.content}>
                <div className={styles.category}>
                    <FormControlLabel
                        control={<Switch checked disabled />}
                        label={t('categories.necessary.title')}
                    />
                    <p className={styles.description}>{t('categories.necessary.description')}</p>
                </div>

                {OPTIONAL_CATEGORIES.map((category) => (
                    <div key={category} className={styles.category}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={draft[category] === true}
                                    onChange={(_, value) => toggle(category, value)}
                                />
                            }
                            label={t(`categories.${category}.title`)}
                        />
                        <p className={styles.description}>
                            {t(`categories.${category}.description`)}
                        </p>
                    </div>
                ))}

                <p className={styles.description}>
                    {t.rich('details', {
                        policy: (chunks) => (
                            <Link href="/cookies" onClick={closeSettings}>
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </DialogContent>
            <DialogActions>
                <Button onClick={closeSettings}>{t('cancel')}</Button>
                <Button variant="contained" onClick={() => decide(draft)}>
                    {t('save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
