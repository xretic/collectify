import { ImageResponse } from 'next/og';
import { OgLogo } from '@/shared/server/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon on iOS (which rounds the corners itself). */
export default function AppleIcon() {
    return new ImageResponse(<OgLogo size={180} square />, size);
}
