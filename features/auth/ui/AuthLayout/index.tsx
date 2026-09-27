import type { ReactNode } from 'react';
import { OAuthButtons } from '../OAuthButtons';
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

    return (
        <section className={styles.page}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

            <div className={styles.form}>{children}</div>

            {oauth && (
                <>
                    <div className={styles.divider}>{t('orContinueWith')}</div>
                    <OAuthButtons />
                </>
            )}

            {footer && <p className={styles.footer}>{footer}</p>}
        </section>
    );
}
