import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { socialMetadata } from '@/shared/i18n/metadata';
import { legalDetails, currentLegalVersion } from '@/shared/server/legal';
import { canDeleteUploads } from '@/shared/server/uploadcare';
import PrivacyPolicyPage from '@/views/privacy-policy/ui/PrivacyPolicyPage';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');
    const title = t('pages.privacyPolicy');
    const description = t('privacyDescription');

    return {
        title,
        description,
        ...(await socialMetadata({ title, description, path: '/privacy-policy' })),
    };
}

export default async function PrivacyPolicyPageRoute() {
    return (
        <PrivacyPolicyPage
            legal={legalDetails()}
            deletesUploads={canDeleteUploads()}
            version={await currentLegalVersion('privacy')}
        />
    );
}
