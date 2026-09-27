import { useFormatter, useTranslations } from 'next-intl';
import type { LegalVersion } from '@/shared/server/legal';
import { LegalDocument, LegalSection, legalTags } from '@/shared/ui/LegalDocument';
import { CookieSettingsButton } from '@/features/consent/ui/CookieSettingsButton';
import styles from '@/shared/ui/LegalDocument/index.module.css';

/** Every cookie and storage entry the site sets, and why (all strictly necessary or a choice you made). */
const ENTRIES = [
    { name: 'sessionId', type: 'cookie', purpose: 'session', duration: 'days14' },
    { name: 'NEXT_LOCALE', type: 'cookie', purpose: 'locale', duration: 'year' },
    { name: 'oauth_state, oauth_next', type: 'cookie', purpose: 'oauth', duration: 'minutes10' },
    { name: 'theme', type: 'localStorage', purpose: 'theme', duration: 'untilCleared' },
    {
        name: 'collectify:custom-themes',
        type: 'localStorage',
        purpose: 'customThemes',
        duration: 'untilCleared',
    },
    {
        name: 'people-you-may-know',
        type: 'localStorage',
        purpose: 'peopleWidget',
        duration: 'untilCleared',
    },
    {
        name: 'collectify:recent-searches',
        type: 'localStorage',
        purpose: 'recentSearches',
        duration: 'untilCleared',
    },
    {
        name: 'collectify:consent',
        type: 'localStorage',
        purpose: 'consent',
        duration: 'untilCleared',
    },
    {
        name: 'collectify:pending-intent',
        type: 'sessionStorage',
        purpose: 'pendingIntent',
        duration: 'minutes30',
    },
    {
        name: 'verify-email-banner-dismissed',
        type: 'sessionStorage',
        purpose: 'emailBanner',
        duration: 'session',
    },
] as const;

/** `version` comes from the `LegalDocumentVersion` table. */
export default function CookiePolicyPage({ version }: { version: LegalVersion | null }) {
    const t = useTranslations('cookiePolicy');
    const tl = useTranslations('legal');
    const format = useFormatter();

    return (
        <LegalDocument
            title={t('title')}
            updated={
                version
                    ? tl('updated', {
                          date: format.dateTime(version.effectiveAt, {
                              dateStyle: 'long',
                              timeZone: 'UTC',
                          }),
                          version: version.version,
                      })
                    : undefined
            }
            intro={t('intro')}
        >
            <LegalSection title={t('listTitle')}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t('columns.name')}</th>
                            <th>{t('columns.type')}</th>
                            <th>{t('columns.purpose')}</th>
                            <th>{t('columns.duration')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ENTRIES.map((entry) => (
                            <tr key={entry.name}>
                                <td>
                                    <code>{entry.name}</code>
                                </td>
                                <td>{t(`types.${entry.type}`)}</td>
                                <td>{t(`purposes.${entry.purpose}`)}</td>
                                <td>{t(`durations.${entry.duration}`)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </LegalSection>

            <LegalSection title={t('consentTitle')}>
                <p>{t('consentText')}</p>
            </LegalSection>

            <LegalSection title={t('manageTitle')}>
                <p>{t.rich('manageText', legalTags)}</p>
                <div>
                    <CookieSettingsButton variant="button" />
                </div>
            </LegalSection>
        </LegalDocument>
    );
}
