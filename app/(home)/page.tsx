import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import HomePage from '@/views/home/ui/HomePage';
import { resolveFeed } from '@/views/home/lib/feed';
import { boardQueryKeys } from '@/entities/board/model/queryKeys';
import { getOwnedBoard, listBoards } from '@/entities/board/server/queries';
import { categoryQueryKeys } from '@/entities/category/model/queryKeys';
import { listActiveCategories, listCategoryShowcase } from '@/entities/category/server/queries';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { COLLECTIONS_CACHE_NAMESPACE, listCollections } from '@/entities/collection/server/queries';
import { recommendForBoard, recommendForUser } from '@/entities/collection/server/recommendations';
import { tagQueryKeys } from '@/entities/tag/model/queryKeys';
import { searchTags } from '@/entities/tag/server/queries';
import { getCookieViewer } from '@/features/auth/server/guards';
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

/**
 * Everything the first screen of the feed shows, loaded on the server: the page
 * arrives filled in and the browser makes no API calls until the user scrolls
 * or filters. Failed prefetches are left to the client to retry.
 */
async function prefetchHome(queryClient: QueryClient, query: Query) {
    const { viewer } = await getCookieViewer();
    const userId = viewer?.userId ?? null;
    const feed = resolveFeed(readParam(query), Boolean(viewer));
    const jobs: Promise<unknown>[] = [];

    if (userId) {
        jobs.push(
            queryClient.prefetchQuery({
                queryKey: boardQueryKeys.mine(),
                queryFn: () => listBoards(userId),
            }),
        );
    } else if (!feed.filtered) {
        jobs.push(
            queryClient.prefetchQuery({
                queryKey: [...categoryQueryKeys.all, 'showcase'],
                queryFn: listCategoryShowcase,
            }),
        );
    }

    if (feed.kind === 'explore') {
        const params = parseFeedParams(readParam(query));

        jobs.push(
            queryClient.prefetchInfiniteQuery({
                queryKey: [...collectionQueryKeys.lists(), 'feed', params],
                // Only the guest feed is the same for everyone, so only it is cached.
                queryFn: () =>
                    userId
                        ? listCollections({ ...params, page: 0 }, userId)
                        : withCache(
                              COLLECTIONS_CACHE_NAMESPACE,
                              `ssr:${JSON.stringify(params)}`,
                              30,
                              () => listCollections({ ...params, page: 0 }, null),
                          ),
                initialPageParam: 0,
            }),
        );

        // Popular tags for the tag filter. With tags picked, suggestions follow the
        // first tag's category, which the client resolves itself.
        if (params.tags.length === 0) {
            jobs.push(
                (async () => {
                    const categories = await listActiveCategories();
                    const scope = params.category
                        ? (categories.find((category) => category.slug === params.category)?.id ??
                          null)
                        : null;

                    await queryClient.prefetchQuery({
                        queryKey: tagQueryKeys.search(scope ?? 0, ''),
                        queryFn: () => searchTags(scope, '', userId),
                    });
                })(),
            );
        }
    } else if (userId) {
        const board = feed.kind === 'board' ? feed.boardId : null;

        jobs.push(
            queryClient.prefetchInfiniteQuery({
                queryKey: [...collectionQueryKeys.lists(), 'recommended', board],
                queryFn: async () => {
                    if (!board) return recommendForUser(userId, 0);

                    await getOwnedBoard(board, userId);
                    return recommendForBoard(userId, board, 0);
                },
                initialPageParam: 0,
            }),
        );
    }

    await Promise.all(jobs);
}

export default async function HomeRoute({ searchParams }: Props) {
    const queryClient = new QueryClient();
    const query = await searchParams;
    const isHome = Object.keys(query).length === 0;

    await prefetchHome(queryClient, query);

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
                <HomePage />
            </Suspense>
        </HydrationBoundary>
    );
}
