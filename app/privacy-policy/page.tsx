import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PrivacyPolicyPage from '@/views/privacy-policy/ui/PrivacyPolicyPage';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');
    return { title: t('pages.privacyPolicy'), description: t('privacyDescription') };
}

export default function PrivacyPolicyRoute() {
    return <PrivacyPolicyPage />;
}
