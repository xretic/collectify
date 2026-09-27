'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { withNext } from '@/shared/lib/safeNextPath';
import { useAuthPromptStore } from '../../model/authPromptStore';
import { OAuthButtons } from '../OAuthButtons';
import { LegalConsent } from '../LegalConsent';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** "Join Collectify" dialog shown when a guest tries something that needs an account. */
export function AuthPromptDialog() {
    const t = useTranslations('authPrompt');
    const { open, reason, close } = useAuthPromptStore();
    const pathname = usePathname();

    // Leaving the page (back button, a link) dismisses it.
    useEffect(() => close(), [pathname, close]);

    // Back to this very page (with its filters) after signing in.
    const next = open ? `${pathname}${window.location.search}` : pathname;

    return (
        <Dialog
            open={open}
            onClose={close}
            maxWidth="xs"
            fullWidth
            classes={{ paper: styles.paper }}
            aria-labelledby="auth-prompt-title"
        >
            <IconButton className={styles.close} onClick={close} aria-label={t('close')}>
                <CloseIcon />
            </IconButton>

            <div className={styles.body}>
                <Image src="/icon.svg" alt="" width={56} height={56} />
                <h2 id="auth-prompt-title" className={styles.title}>
                    {t(`titles.${reason}`)}
                </h2>
                <p className={styles.subtitle}>{t('subtitle')}</p>

                <div className={styles.actions}>
                    <OAuthButtons next={next} layout="stack" />

                    <Button
                        component={Link}
                        href={withNext('/auth/register', next)}
                        onClick={close}
                        variant="outlined"
                        size="large"
                        fullWidth
                        startIcon={<EmailOutlinedIcon />}
                    >
                        {t('email')}
                    </Button>
                </div>

                <LegalConsent variant="providers" />

                <p className={styles.footer}>
                    {t.rich('haveAccount', {
                        link: (chunks) => (
                            <Link href={withNext('/auth/login', next)} onClick={close}>
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </div>
        </Dialog>
    );
}
