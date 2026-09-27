import type { ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { LegalDetails, LegalVersion } from '@/shared/server/legal';
import { LegalDocument, LegalSection, legalTags } from '@/shared/ui/LegalDocument';

const SECTIONS = [
    'eligibility',
    'account',
    'content',
    'rights',
    'conduct',
    'moderation',
    'copyright',
    'price',
    'service',
    'termination',
    'disclaimer',
    'liability',
    'changes',
] as const;

export default function TermsPage({
    legal,
    version,
}: {
    legal: LegalDetails;
    /** From the `LegalDocumentVersion` table. */
    version: LegalVersion | null;
}) {
    const t = useTranslations('terms');
    const tl = useTranslations('legal');
    const format = useFormatter();
    const mail = (chunks: ReactNode) => <a href={`mailto:${legal.email}`}>{chunks}</a>;
    const tags = { ...legalTags, mail };

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
            intro={t.rich('intro', { ...tags, operator: legal.operator })}
        >
            {SECTIONS.map((key) => (
                <LegalSection key={key} title={t(`sections.${key}.title`)}>
                    <p>{t.rich(`sections.${key}.text`, tags)}</p>
                </LegalSection>
            ))}

            <LegalSection title={t('sections.law.title')}>
                <p>
                    {legal.country
                        ? t('sections.law.country', { country: legal.country })
                        : t('sections.law.text')}
                </p>
            </LegalSection>

            <LegalSection title={t('sections.contact.title')}>
                <p>
                    {legal.email
                        ? t.rich('sections.contact.email', { ...tags, email: legal.email })
                        : t.rich('sections.contact.text', tags)}
                </p>
            </LegalSection>
        </LegalDocument>
    );
}
