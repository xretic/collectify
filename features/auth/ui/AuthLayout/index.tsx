'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { OAuthButtons } from '../OAuthButtons';
import { LegalConsent } from '../LegalConsent';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type AuthLayoutProps = {
    title: string;
    subtitle?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    /** "Continue with Google / GitHub" under the form. */
    oauth?: boolean;
};

export function AuthLayout({ title, subtitle, children, footer, oauth = true }: AuthLayoutProps) {
    const t = useTranslations('auth');
    const next = useSearchParams().get('next') ?? undefined;

    return (
        <section className={styles.page}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

            {/* One tap beats a form: providers first, email below. */}
            {oauth && (
                <div className={styles.form}>
                    <OAuthButtons next={next} layout="stack" />
                    <LegalConsent variant="providers" />
                    <div className={styles.divider}>{t('orEmail')}</div>
                </div>
            )}

            <div className={styles.form}>{children}</div>

            {footer && <p className={styles.footer}>{footer}</p>}
        </section>
    );
}
