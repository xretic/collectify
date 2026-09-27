import 'server-only';
import { ImageResponse } from 'next/og';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCollectionPreview } from '@/entities/collection/server/preview';
import { formatCompact } from '@/shared/lib/format/number';
import type { LooseTranslator } from '@/shared/i18n/types';
import {
    loadOgFonts,
    loadOgImage,
    loadOgImages,
    OG_SIZE,
    OgByline,
    OgCard,
} from '@/shared/server/og';
import { renderSiteImage } from './siteImage';

/** Share card of a public collection: its items as a mosaic, title, author and counters. */
export async function renderCollectionImage(collectionId: number | null) {
    const collection = collectionId ? await getCollectionPreview(collectionId) : null;

    // Private or deleted: the generic card, so nothing about it leaks.
    if (!collection?.user) return renderSiteImage();

    const { category, user } = collection;
    // Few item images make a poor mosaic: the cover alone reads better.
    const imageUrls =
        collection.items.length >= 3
            ? collection.items.map((item) => item.imageUrl)
            : [collection.bannerUrl];

    const [t, categories, locale, fonts, images, avatar] = await Promise.all([
        getTranslations('og'),
        getTranslations('categories') as unknown as Promise<LooseTranslator>,
        getLocale(),
        loadOgFonts(),
        loadOgImages(imageUrls, 4),
        loadOgImage(user.avatarUrl),
    ]);

    return new ImageResponse(
        <OgCard
            eyebrow={categories.has(category.slug) ? categories(category.slug) : category.name}
            title={collection.name}
            byline={<OgByline avatar={avatar} name={user.fullName} username={user.username} />}
            stats={[
                t('items', { count: collection._count.items }),
                t('likes', {
                    count: collection.likeCount,
                    formatted: formatCompact(locale, collection.likeCount),
                }),
            ]}
            images={images}
        />,
        { ...OG_SIZE, fonts },
    );
}
