import { OG_CONTENT_TYPE, OG_SIZE } from '@/shared/server/og';
import { renderSiteImage } from '@/widgets/share-image/server/siteImage';

export const alt = 'Collectify';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 86400;

export default function Image() {
    return renderSiteImage();
}
