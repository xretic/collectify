import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import styles from './PrivacyPolicyPage.module.css';

const UPDATED_AT = new Date(Date.UTC(2026, 8, 25));

const COLLECTED = ['email', 'names', 'password', 'profile', 'content'] as const;
const LOCATION = ['location', 'birthDate'] as const;
const PARAGRAPHS = [
    'why',
    'recommendations',
    'age',
    'cookies',
    'storage',
    'moderation',
    'thirdParties',
] as const;

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

export default function PrivacyPolicyPage() {
    const t = useTranslations('privacy');
    const format = useFormatter();

    const section = (key: (typeof PARAGRAPHS)[number]) => (
        <section key={key} className={styles.section}>
            <h2 className={styles.sectionTitle}>{t(`${key}.title`)}</h2>
            <p className={styles.text}>{t(`${key}.text`)}</p>
        </section>
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.updated}>
                {t('updated', { date: format.dateTime(UPDATED_AT, { dateStyle: 'long' }) })}
            </p>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('collect.title')}</h2>
                <div className={styles.text}>
                    {t('collect.intro')}
                    <ul>
                        {COLLECTED.map((key) => (
                            <li key={key}>{t(`collect.items.${key}`)}</li>
                        ))}
                    </ul>
                </div>
            </section>

            {section('why')}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('location.title')}</h2>
                <div className={styles.text}>
                    {t('location.intro')}
                    <ul>
                        {LOCATION.map((key) => (
                            <li key={key}>{t.rich(`location.items.${key}`, { strong })}</li>
                        ))}
                    </ul>
                </div>
            </section>

            {PARAGRAPHS.filter((key) => key !== 'why').map(section)}
        </div>
    );
}
