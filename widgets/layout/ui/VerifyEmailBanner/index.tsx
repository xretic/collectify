'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import { authApi } from '@/entities/auth/api/authApi';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

const DISMISSED_KEY = 'verify-email-banner-dismissed';

function readDismissed() {
    try {
        return sessionStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

/** Asks to confirm the email; dismissing hides it until the next browser session. */
export function VerifyEmailBanner({ email }: { email: string }) {
    const t = useTranslations('nav');
    const [dismissed, setDismissed] = useState(readDismissed);

    const resend = useMutation({
        mutationFn: authApi.resendVerification,
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    if (dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(DISMISSED_KEY, '1');
        } catch {
            // Storage blocked: it stays hidden until reload.
        }
    };

    return (
        <div className={styles.banner} role="status">
            <MarkEmailUnreadOutlinedIcon className={styles.icon} fontSize="small" />

            <span className={styles.text}>
                {t.rich('verifyEmail', { email, strong: (chunks) => <strong>{chunks}</strong> })}
            </span>

            {resend.isSuccess ? (
                <span className={styles.sent}>{t('linkSent')}</span>
            ) : (
                <button
                    type="button"
                    className={styles.action}
                    onClick={() => resend.mutate()}
                    disabled={resend.isPending}
                >
                    {t('resendLink')}
                </button>
            )}

            <IconButton
                size="small"
                className={styles.close}
                onClick={dismiss}
                aria-label={t('dismiss')}
            >
                <CloseIcon fontSize="inherit" />
            </IconButton>
        </div>
    );
}
