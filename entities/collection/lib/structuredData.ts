import { absoluteUrl, interactionCounter, SCHEMA_CONTEXT } from '@/shared/lib/seo/structuredData';
import type { CollectionDetails } from '../model/types';

/** Items listed in the markup; more adds size without helping search. */
const LISTED_ITEMS = 50;

/** A public collection as a schema.org CollectionPage whose main entity is the list of its items. */
export function collectionStructuredData(
    base: URL,
    collection: CollectionDetails,
    categoryName: string,
) {
    const url = absoluteUrl(base, `/collections/${collection.id}`);

    return {
        '@context': SCHEMA_CONTEXT,
        '@type': 'CollectionPage',
        name: collection.name,
        description: collection.description || undefined,
        url,
        image: collection.bannerUrl || undefined,
        datePublished: collection.createdAt,
        genre: categoryName,
        keywords: collection.tags.map((tag) => tag.name).join(', ') || undefined,
        author: {
            '@type': 'Person',
            name: collection.author.fullName,
            alternateName: `@${collection.author.username}`,
            url: absoluteUrl(base, `/users/${collection.author.id}`),
        },
        interactionStatistic: [
            interactionCounter('LikeAction', collection.likes),
            interactionCounter('CommentAction', collection.comments),
        ],
        isPartOf: { '@type': 'WebSite', name: 'Collectify', url: absoluteUrl(base, '/') },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: collection.items.length,
            itemListElement: collection.items.slice(0, LISTED_ITEMS).map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.title || `${collection.name} #${index + 1}`,
                description: item.description || undefined,
                image: item.imageUrl ?? undefined,
                url: item.sourceUrl ?? undefined,
            })),
        },
    };
}
