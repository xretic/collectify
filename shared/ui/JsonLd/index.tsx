type JsonLdProps = { data: Record<string, unknown> | Record<string, unknown>[] };

/**
 * schema.org structured data for search engines (rich results). `<` is
 * escaped so user text cannot close the script tag.
 */
export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}
