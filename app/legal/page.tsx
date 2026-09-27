import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { socialMetadata } from '@/shared/i18n/metadata';
import { legalDetails } from '@/shared/server/legal';
import LegalNoticePage from '@/views/legal-notice/ui/LegalNoticePage';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');
    const title = t('pages.legalNotice');
    const description = t('legalNoticeDescription');

    return {
        title,
        description,
        ...(await socialMetadata({ title, description, path: '/legal' })),
    };
}

export default function LegalNoticePageRoute() {
    return <LegalNoticePage legal={legalDetails()} />;
}
