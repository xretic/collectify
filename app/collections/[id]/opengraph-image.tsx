import { idSchema } from '@/shared/lib/validation/ids';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/shared/server/og';
import { renderCollectionImage } from '@/widgets/share-image/server/collectionImage';

export const alt = 'Collectify';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
    const id = idSchema.safeParse((await params).id);
    return renderCollectionImage(id.success ? id.data : null);
}
