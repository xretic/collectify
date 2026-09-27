import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { socialMetadata } from '@/shared/i18n/metadata';
import { legalDetails, currentLegalVersion } from '@/shared/server/legal';
import TermsPage from '@/views/terms/ui/TermsPage';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');
    const title = t('pages.terms');
    const description = t('termsDescription');

    return {
        title,
        description,
        ...(await socialMetadata({ title, description, path: '/terms' })),
    };
}

export default async function TermsPageRoute() {
    return <TermsPage legal={legalDetails()} version={await currentLegalVersion('terms')} />;
}
