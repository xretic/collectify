import type { ReactNode } from 'react';
import { OAuthButtons } from '../OAuthButtons';
import styles from './index.module.css';

type AuthLayoutProps = {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
    return (
        <section className={styles.page}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>

            <div className={styles.form}>{children}</div>

            <div className={styles.divider}>or continue with</div>
            <OAuthButtons />

            <p className={styles.footer}>{footer}</p>
        </section>
    );
}
