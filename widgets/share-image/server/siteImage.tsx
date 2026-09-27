import 'server-only';
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { db } from '@/shared/server/db';
import { loadOgFonts, loadOgImages, OG_SIZE, OgCard } from '@/shared/server/og';

async function popularCovers() {
    try {
        const rows = await db.collection.findMany({
            where: { private: false },
            orderBy: { likeCount: 'desc' },
            take: 8,
            select: { bannerUrl: true },
        });
        return rows.map((row) => row.bannerUrl);
    } catch {
        // Also rendered at build time, when the database may be unreachable.
        return [];
    }
}

/** The generic card: the home page, and any private or missing collection / profile. */
export async function renderSiteImage() {
    const [t, fonts, covers] = await Promise.all([
        getTranslations('og'),
        loadOgFonts(),
        popularCovers(),
    ]);

    return new ImageResponse(
        <OgCard
            title={t('tagline')}
            stats={[t('siteStats')]}
            images={await loadOgImages(covers, 4)}
        />,
        { ...OG_SIZE, fonts },
    );
}
