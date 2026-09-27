import 'server-only';
import { ImageResponse } from 'next/og';
import { getLocale, getTranslations } from 'next-intl/server';
import { getProfilePreview } from '@/entities/user/server/preview';
import { formatCompact } from '@/shared/lib/format/number';
import {
    loadOgFonts,
    loadOgImage,
    loadOgImages,
    OG_SIZE,
    OgByline,
    OgCard,
} from '@/shared/server/og';
import { renderSiteImage } from './siteImage';

/** Share card of a profile: who it is, counters and a mosaic of their popular covers. */
export async function renderProfileImage(userId: number | null) {
    const profile = userId ? await getProfilePreview(userId) : null;
    if (!profile) return renderSiteImage();

    const [t, locale, fonts, images, avatar] = await Promise.all([
        getTranslations('og'),
        getLocale(),
        loadOgFonts(),
        loadOgImages(profile.covers, 4),
        loadOgImage(profile.avatarUrl),
    ]);

    return new ImageResponse(
        <OgCard
            eyebrow={t('profile')}
            title={profile.fullName}
            byline={<OgByline avatar={avatar} username={profile.username} />}
            stats={[
                t('collections', { count: profile.collections }),
                t('followers', {
                    count: profile.followers,
                    formatted: formatCompact(locale, profile.followers),
                }),
            ]}
            images={images}
        />,
        { ...OG_SIZE, fonts },
    );
}
