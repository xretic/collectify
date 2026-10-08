import type { Metadata } from 'next';
import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { NO_INDEX, socialMetadata, truncate } from '@/shared/i18n/metadata';
import type { LooseTranslator } from '@/shared/i18n/types';
import { siteUrl } from '@/shared/server/env';
import { JsonLd } from '@/shared/ui/JsonLd';
import { getCollectionMeta } from '@/entities/collection/server/preview';
import { collectionStructuredData } from '@/entities/collection/lib/structuredData';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { CollectionDetailsPage } from '@/views/collection-details/ui/CollectionDetailsPage';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getCollectionDetails } from '@/entities/collection/server/queries';
import { recordView } from '@/entities/collection/server/recommendations';
import { listRelatedCollections } from '@/entities/collection/server/related';
import { commentQueryKeys } from '@/entities/comment/model/queryKeys';
import { listComments } from '@/entities/comment/server/queries';
import { getViewerFromCookies } from '@/features/auth/server/guards';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const collectionId = Number((await params).id);
    const collection =
        Number.isInteger(collectionId) && collectionId > 0
            ? await getCollectionMeta(collectionId)
            : null;

    const t = await getTranslations('meta');
    // Missing or private: nothing about it is published.
    if (!collection?.user) return { title: t('pages.collection'), robots: NO_INDEX };

    const categories = (await getTranslations('categories')) as unknown as LooseTranslator;
    const { category, user } = collection;
    const categoryName = categories.has(category.slug) ? categories(category.slug) : category.name;

    // "13 items in Travel by Luz Flatley. My personal canon…": what, where, who, then the pitch.
    const lead = t('collectionLead', {
        count: collection._count.items,
        category: categoryName,
        name: user.fullName,
    });
    const description = truncate(`${lead} ${collection.description}`);

    return {
        title: collection.name,
        description,
        ...(await socialMetadata({
            title: collection.name,
            description,
            path: `/collections/${collectionId}`,
            type: 'article',
            publishedTime: collection.createdAt.toISOString(),
            authors: [new URL(`/users/${user.id}`, siteUrl()).toString()],
            tags: collection.tags.map(({ tag }) => tag.name),
        })),
    };
}

/** Rendered on the server with its data, so the items are in the HTML (search engines, first paint). */
export default async function CollectionRoute({ params }: Props) {
    const collectionId = Number((await params).id);
    const queryClient = new QueryClient();
    let structuredData: ReturnType<typeof collectionStructuredData> | null = null;

    if (Number.isInteger(collectionId) && collectionId > 0) {
        const viewer = await getViewerFromCookies();
        // Missing or private to someone else: the page shows its 404 as before.
        const collection = await getCollectionDetails(collectionId, viewer?.userId ?? null).catch(
            () => null,
        );

        if (collection) {
            queryClient.setQueryData(collectionQueryKeys.detail(collectionId), collection);

            // The rest of the page, so the browser does not fetch it right after load.
            await Promise.all([
                queryClient.prefetchInfiniteQuery({
                    queryKey: commentQueryKeys.byCollection(collectionId),
                    queryFn: () => listComments(collectionId, null),
                    initialPageParam: null as number | null,
                }),
                queryClient.prefetchQuery({
                    queryKey: collectionQueryKeys.related(collectionId),
                    queryFn: () => listRelatedCollections(collectionId, viewer?.userId ?? null),
                }),
            ]);

            if (!collection.isPrivate) {
                const categories = (await getTranslations(
                    'categories',
                )) as unknown as LooseTranslator;
                const { category } = collection;
                structuredData = collectionStructuredData(
                    siteUrl(),
                    collection,
                    categories.has(category.slug) ? categories(category.slug) : category.name,
                );
            }

            // Same signal the API records: the page may not refetch while the data is fresh.
            if (viewer && !collection.isPrivate && collection.author.id !== viewer.userId) {
                const { userId } = viewer;
                after(() =>
                    recordView(userId, collectionId).catch((error) =>
                        console.error('[recommendations] view not recorded:', error),
                    ),
                );
            }
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {structuredData && <JsonLd data={structuredData} />}
            <CollectionDetailsPage />
        </HydrationBoundary>
    );
}
