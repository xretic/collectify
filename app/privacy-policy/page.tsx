import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { socialMetadata } from '@/shared/i18n/metadata';
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

export default function PrivacyPolicyRoute() {
    return <PrivacyPolicyPage />;
}
