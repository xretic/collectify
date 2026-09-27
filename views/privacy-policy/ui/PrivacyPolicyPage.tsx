import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { LegalDetails, LegalVersion } from '@/shared/server/legal';
import { LegalDocument, LegalSection, legalTags } from '@/shared/ui/LegalDocument';

const COLLECTED = ['email', 'names', 'password', 'profile', 'content'] as const;
const LOCATION = ['location', 'birthDate'] as const;
const PROCESSORS = [
    'hosting',
    'database',
    'images',
    'email',
    'realtime',
    'cache',
    'signIn',
] as const;

type PrivacyPolicyPageProps = {
    legal: LegalDetails;
    /** Whether deleting an account also erases its uploaded images (the media host key is set). */
    deletesUploads: boolean;
    /** From the `LegalDocumentVersion` table. */
    version: LegalVersion | null;
};

export default function PrivacyPolicyPage({
    legal,
    deletesUploads,
    version,
}: PrivacyPolicyPageProps) {
    const t = useTranslations('privacy');
    const tl = useTranslations('legal');
    const format = useFormatter();
    const mail = (chunks: ReactNode) => <a href={`mailto:${legal.email}`}>{chunks}</a>;
    const tags = { ...legalTags, mail };

    const paragraph = (
        key:
            | 'why'
            | 'legalBases'
            | 'recommendations'
            | 'age'
            | 'cookies'
            | 'externalImages'
            | 'moderation'
            | 'thirdParties'
            | 'rights'
            | 'changes',
    ) => (
        <LegalSection key={key} title={t(`${key}.title`)}>
            <p>{t.rich(`${key}.text`, tags)}</p>
        </LegalSection>
    );

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
        >
            <LegalSection title={t('controller.title')}>
                <p>
                    {t('controller.text', { operator: legal.operator })}{' '}
                    {legal.email
                        ? t.rich('controller.email', { ...tags, email: legal.email })
                        : t.rich('controller.noEmail', tags)}
                </p>
            </LegalSection>

            <LegalSection title={t('collect.title')}>
                <p>{t('collect.intro')}</p>
                <ul>
                    {COLLECTED.map((key) => (
                        <li key={key}>{t(`collect.items.${key}`)}</li>
                    ))}
                </ul>
            </LegalSection>

            {paragraph('why')}
            {paragraph('legalBases')}

            <LegalSection title={t('location.title')}>
                <p>{t('location.intro')}</p>
                <ul>
                    {LOCATION.map((key) => (
                        <li key={key}>{t.rich(`location.items.${key}`, tags)}</li>
                    ))}
                </ul>
            </LegalSection>

            {paragraph('recommendations')}
            {paragraph('age')}
            {paragraph('cookies')}

            <LegalSection title={t('processors.title')}>
                <p>{t('processors.intro')}</p>
                <ul>
                    {PROCESSORS.map((key) => (
                        <li key={key}>{t.rich(`processors.items.${key}`, tags)}</li>
                    ))}
                </ul>
                <p>{t('processors.transfers')}</p>
            </LegalSection>

            {paragraph('externalImages')}
            {paragraph('moderation')}
            {paragraph('thirdParties')}
            <LegalSection title={t('retention.title')}>
                <p>{deletesUploads ? t('retention.text') : t('retention.textKeepsUploads')}</p>
            </LegalSection>
            {paragraph('rights')}
            {paragraph('changes')}
        </LegalDocument>
    );
}
