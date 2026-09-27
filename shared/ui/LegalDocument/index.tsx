import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './index.module.css';

type LegalDocumentProps = {
    title: string;
    /** "Last updated: …" line; left out when the date is unknown. */
    updated?: string;
    intro?: ReactNode;
    children: ReactNode;
};

/** Layout of the legal pages (Terms, Privacy, Cookies, Legal notice): one readable column. */
export function LegalDocument({ title, updated, intro, children }: LegalDocumentProps) {
    return (
        <article className={styles.container}>
            <h1 className={styles.title}>{title}</h1>
            {updated && <p className={styles.updated}>{updated}</p>}
            {intro && <p className={styles.intro}>{intro}</p>}
            {children}
        </article>
    );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <div className={styles.text}>{children}</div>
        </section>
    );
}

/** Tags the legal texts may use: links to the other documents and emphasis. */
export const legalTags = {
    terms: (chunks: ReactNode) => <Link href="/terms">{chunks}</Link>,
    privacy: (chunks: ReactNode) => <Link href="/privacy-policy">{chunks}</Link>,
    cookies: (chunks: ReactNode) => <Link href="/cookies">{chunks}</Link>,
    legal: (chunks: ReactNode) => <Link href="/legal">{chunks}</Link>,
    settings: (chunks: ReactNode) => <Link href="/settings">{chunks}</Link>,
    strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
};
