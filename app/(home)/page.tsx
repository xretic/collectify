import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import HomePage from '@/views/home/ui/HomePage';
import { SESSION_COOKIE } from '@/entities/session/server/session';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { COLLECTIONS_CACHE_NAMESPACE, listCollections } from '@/entities/collection/server/queries';
import { parseFeedParams } from '@/features/collection/browse/lib/feedParams';
import { withCache } from '@/shared/server/cache';
import { db } from '@/shared/server/db';
import { siteUrl } from '@/shared/server/env';
import { NO_INDEX, socialMetadata } from '@/shared/i18n/metadata';
import type { LooseTranslator } from '@/shared/i18n/types';
import { siteStructuredData } from '@/shared/lib/seo/structuredData';
import { JsonLd } from '@/shared/ui/JsonLd';

type Query = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<Query> };

/** Tags this rare are not landing pages (thin content, and user-made tags can be spam). */
const INDEXED_TAG_MIN_USES = 3;

const readParam = (query: Query) => (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
};

const notALanding: Metadata = { robots: NO_INDEX, alternates: { canonical: '/' } };

/**
 * The home page, one category (`?category=`) and one tag (`?tag=`) are landing
 * pages with their own title; personal feeds, searches and filter mixes are not indexed.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const query = await searchParams;
    const params = parseFeedParams(readParam(query));
    const t = await getTranslations('meta');

    const personal = ['feed', 'board', 'page'].some((key) => query[key] !== undefined);
    const mixed = params.tags.length > 1 || (params.category && params.tags.length > 0);
    if (personal || mixed || params.query || params.sort !== 'popular') return notALanding;

    if (params.category) {
        const category = await db.category.findFirst({
            where: { slug: params.category, isActive: true },
            select: { slug: true, name: true },
        });
        if (!category) return notALanding;

        const names = (await getTranslations('categories')) as unknown as LooseTranslator;
        const name = names.has(category.slug) ? names(category.slug) : category.name;
        const title = t('categoryTitle', { category: name });
        const description = t('categoryDescription', { category: name });

        return {
            title,
            description,
            ...(await socialMetadata({ title, description, path: `/?category=${category.slug}` })),
        };
    }

    if (params.tags.length === 1) {
        const tag = await db.tag.findUnique({
            where: { id: params.tags[0] },
            select: { id: true, name: true, usageCount: true },
        });
        if (!tag || tag.usageCount < INDEXED_TAG_MIN_USES) return notALanding;

        const title = t('tagTitle', { tag: tag.name });
        const description = t('tagDescription', { tag: tag.name });

        return {
            title,
            description,
            ...(await socialMetadata({ title, description, path: `/?tag=${tag.id}` })),
        };
    }

    return {
        title: { absolute: t('title') },
        description: t('description'),
        ...(await socialMetadata({ title: t('title'), description: t('description'), path: '/' })),
    };
}

export default async function HomeRoute({ searchParams }: Props) {
    // Guests (no session cookie) get the landing rendered on the server, without waiting for /me.
    const hasSession = (await cookies()).has(SESSION_COOKIE);
    const queryClient = new QueryClient();
    const query = await searchParams;
    const isHome = Object.keys(query).length === 0;

    // The guest feed is the same for everyone: render its first page on the server
    // (fast first paint, and crawlers see the collections).
    if (!hasSession) {
        const params = parseFeedParams(readParam(query));

        await queryClient.prefetchInfiniteQuery({
            queryKey: [...collectionQueryKeys.lists(), 'feed', params],
            queryFn: () =>
                withCache(COLLECTIONS_CACHE_NAMESPACE, `ssr:${JSON.stringify(params)}`, 30, () =>
                    listCollections({ ...params, page: 0 }, null),
                ),
            initialPageParam: 0,
        });
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {isHome && (
                <JsonLd
                    data={siteStructuredData(
                        siteUrl(),
                        (await getTranslations('meta'))('description'),
                    )}
                />
            )}
            <Suspense>
                <HomePage hasSession={hasSession} />
            </Suspense>
        </HydrationBoundary>
    );
}
