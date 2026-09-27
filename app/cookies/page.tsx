import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { socialMetadata } from '@/shared/i18n/metadata';

import { currentLegalVersion } from '@/shared/server/legal';
import CookiePolicyPage from '@/views/cookie-policy/ui/CookiePolicyPage';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');
    const title = t('pages.cookies');
    const description = t('cookiesDescription');

    return {
        title,
        description,
        ...(await socialMetadata({ title, description, path: '/cookies' })),
    };
}

export default async function CookiePolicyPageRoute() {
    return <CookiePolicyPage version={await currentLegalVersion('cookies')} />;
}
