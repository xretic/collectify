import { ImageResponse } from 'next/og';
import { OgLogo } from '@/shared/server/og';

const SIDE = 512;

/**
 * Maskable app icon for the manifest (not a page `<link>` icon). Launchers may
 * crop it to any shape; the full-bleed logo keeps its "C" well inside the
 * central safe zone.
 */
export function GET() {
    return new ImageResponse(<OgLogo size={SIDE} square />, {
        width: SIDE,
        height: SIDE,
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
}
