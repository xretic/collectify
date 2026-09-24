import type { ReactNode } from 'react';
import styles from './index.module.css';

type SectionProps = {
    title: string;
    hint?: string;
    action?: ReactNode;
    children: ReactNode;
};

export function Section({ title, hint, action, children }: SectionProps) {
    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <div>
                    <h3 className={styles.title}>{title}</h3>
                    {hint && <p className={styles.hint}>{hint}</p>}
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}
