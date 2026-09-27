import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { db } from '@/shared/server/db';
import { socialMetadata } from '@/shared/i18n/metadata';
import { CollectionDetailsPage } from '@/views/collection-details/ui/CollectionDetailsPage';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const collectionId = Number((await params).id);

    const collection =
        Number.isInteger(collectionId) && collectionId > 0
            ? await db.collection.findFirst({
                  where: { id: collectionId, private: false },
                  select: { name: true, description: true },
              })
            : null;

    if (!collection) return { title: (await getTranslations('meta.pages'))('collection') };

    return {
        title: collection.name,
        description: collection.description,
        ...socialMetadata({ title: collection.name, description: collection.description }),
    };
}

export default function CollectionRoute() {
    return <CollectionDetailsPage />;
}
