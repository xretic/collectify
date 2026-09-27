import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { LegalDetails } from '@/shared/server/legal';
import { LegalDocument, LegalSection } from '@/shared/ui/LegalDocument';

const DOCUMENTS = [
    { href: '/terms', key: 'terms' },
    { href: '/privacy-policy', key: 'privacy' },
    { href: '/cookies', key: 'cookies' },
] as const;

/** Who runs Collectify and how to reach them (imprint), plus the policies. */
export default function LegalNoticePage({ legal }: { legal: LegalDetails }) {
    const t = useTranslations('legalNotice');

    return (
        <LegalDocument title={t('title')} updated={t('subtitle')}>
            <LegalSection title={t('operatorTitle')}>
                <p>
                    <strong>{legal.operator}</strong>
                </p>
                {legal.address && <p>{legal.address}</p>}
                {legal.email && (
                    <p>
                        {t('email')}: <a href={`mailto:${legal.email}`}>{legal.email}</a>
                    </p>
                )}
                {legal.country && (
                    <p>
                        {t('country')}: {legal.country}
                    </p>
                )}
            </LegalSection>

            <LegalSection title={t('documentsTitle')}>
                <ul>
                    {DOCUMENTS.map((document) => (
                        <li key={document.href}>
                            <Link href={document.href}>{t(`documents.${document.key}`)}</Link>
                        </li>
                    ))}
                </ul>
            </LegalSection>

            <LegalSection title={t('reportTitle')}>
                <p>{t('reportText')}</p>
            </LegalSection>
        </LegalDocument>
    );
}
