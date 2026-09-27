import { ImageResponse } from 'next/og';
import { OgLogo } from '@/shared/server/og';

export const contentType = 'image/png';

/**
 * PNG app icons (Android wants 192 and 512 to offer installing the app).
 * Rounded with transparent corners: browsers also use them as the tab icon.
 */
export function generateImageMetadata() {
    return [
        { id: '192', size: { width: 192, height: 192 }, contentType },
        { id: '512', size: { width: 512, height: 512 }, contentType },
    ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
    const side = (await id) === '192' ? 192 : 512;
    return new ImageResponse(<OgLogo size={side} />, { width: side, height: side });
}
