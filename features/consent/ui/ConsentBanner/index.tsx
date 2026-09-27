'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';
import CookieOutlinedIcon from '@mui/icons-material/CookieOutlined';
import { allChoices, OPTIONAL_CATEGORIES, useConsentStore } from '../../model/consentStore';
import { ConsentDialog } from '../ConsentDialog';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/**
 * First-visit cookie notice. With only necessary cookies it just informs; once
 * optional categories exist it asks, with "Reject all" as easy as "Accept all".
 */
export function ConsentBanner() {
    const t = useTranslations('consent');
    const { loaded, decided, load, decide, openSettings } = useConsentStore();
    const choose = OPTIONAL_CATEGORIES.length > 0;

    useEffect(load, [load]);

    return (
        <>
            {loaded && !decided && (
                <section className={styles.banner} aria-label={t('label')} role="region">
                    <p className={styles.text}>
                        <CookieOutlinedIcon className={styles.icon} />
                        <span>
                            {t.rich(choose ? 'askText' : 'infoText', {
                                policy: (chunks) => <Link href="/cookies">{chunks}</Link>,
                            })}
                        </span>
                    </p>

                    <div className={styles.actions}>
                        {choose ? (
                            <>
                                <Button onClick={openSettings}>{t('customize')}</Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => decide(allChoices(false))}
                                >
                                    {t('rejectAll')}
                                </Button>
                                <Button variant="outlined" onClick={() => decide(allChoices(true))}>
                                    {t('acceptAll')}
                                </Button>
                            </>
                        ) : (
                            <Button variant="contained" onClick={() => decide({})}>
                                {t('ok')}
                            </Button>
                        )}
                    </div>
                </section>
            )}

            <ConsentDialog />
        </>
    );
}
