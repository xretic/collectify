'use client';

import Image from 'next/image';
import { Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { authApi } from '@/entities/auth/api/authApi';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type OAuthButtonsProps = {
    /** Page to return to after signing in. */
    next?: string;
    /** `stack`: full-width "Continue with …" buttons (the sign-in dialog). */
    layout?: 'row' | 'stack';
};

/** Plain links: the server sets the CSRF `state` cookie and redirects to the provider. */
export function OAuthButtons({ next, layout = 'row' }: OAuthButtonsProps) {
    const t = useTranslations('auth');
    const stacked = layout === 'stack';

    const label = (provider: string) => (stacked ? t('continueWith', { provider }) : provider);

    return (
        <div className={stacked ? styles.stack : styles.buttons}>
            <Button
                href={authApi.oauthUrl('google', next)}
                variant="contained"
                size={stacked ? 'large' : 'medium'}
                fullWidth={stacked}
                className={styles.google}
                startIcon={<Image src="/images/GoogleIcon.png" alt="" width={20} height={20} />}
            >
                {label('Google')}
            </Button>

            <Button
                href={authApi.oauthUrl('github', next)}
                variant="contained"
                size={stacked ? 'large' : 'medium'}
                fullWidth={stacked}
                className={styles.github}
                startIcon={<GitHubIcon />}
            >
                {label('GitHub')}
            </Button>
        </div>
    );
}
