/** schema.org building blocks shared by the page-specific structured data. */

export const SCHEMA_CONTEXT = 'https://schema.org';

/** `https://site/path` from the site origin and a path. */
export const absoluteUrl = (base: URL, path: string) => new URL(path, base).toString();

export const interactionCounter = (
    action: 'LikeAction' | 'CommentAction' | 'FollowAction',
    count: number,
) => ({
    '@type': 'InteractionCounter',
    interactionType: `${SCHEMA_CONTEXT}/${action}`,
    userInteractionCount: count,
});

/**
 * The site and its publisher on the home page: brand in results, and the
 * sitelinks search box (queries land on the home feed search).
 */
export function siteStructuredData(base: URL, description: string) {
    const url = absoluteUrl(base, '/');

    return [
        {
            '@context': SCHEMA_CONTEXT,
            '@type': 'WebSite',
            name: 'Collectify',
            url,
            description,
            potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${url}?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
            },
        },
        {
            '@context': SCHEMA_CONTEXT,
            '@type': 'Organization',
            name: 'Collectify',
            url,
            logo: absoluteUrl(base, '/apple-icon'),
        },
    ];
}
