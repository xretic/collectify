import type { ReactNode } from 'react';
import { OAuthButtons } from '../OAuthButtons';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type AuthLayoutProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
    const t = useTranslations('auth');

    return (
        <section className={styles.page}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            <div className={styles.form}>{children}</div>

            <div className={styles.divider}>{t('orContinueWith')}</div>
            <OAuthButtons />

            <p className={styles.footer}>{footer}</p>
        </section>
    );
}
