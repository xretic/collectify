import type { Area } from 'react-easy-crop';
import { translate } from '@/shared/i18n/translator';

/** Longest side of an edited image; bigger crops are scaled down to stay well under the upload limit. */
const MAX_SIDE = 2560;
const QUALITY = 0.92;

// JPEG stays JPEG; everything else keeps transparency.
const OUTPUT_TYPES: Record<string, string> = {
    'image/jpeg': 'image/jpeg',
    'image/png': 'image/png',
};

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(translate('upload.readFailed')));
        image.src = src;
    });
}

/** Size of the bounding box of a `width`×`height` rectangle rotated by `rotation` degrees. */
export function rotatedSize(width: number, height: number, rotation: number) {
    const rad = (rotation * Math.PI) / 180;
    return {
        width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
        height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
    };
}

/**
 * Renders the `area` (in pixels of the rotated image, as react-easy-crop
 * reports it) of `file` rotated by `rotation` degrees into a new file.
 */
export async function cropImage(file: File, area: Area, rotation: number): Promise<File> {
    const src = URL.createObjectURL(file);

    try {
        const image = await loadImage(src);
        const bounds = rotatedSize(image.naturalWidth, image.naturalHeight, rotation);
        const scale = Math.min(1, MAX_SIDE / Math.max(area.width, area.height));

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(area.width * scale));
        canvas.height = Math.max(1, Math.round(area.height * scale));

        const context = canvas.getContext('2d');
        if (!context) throw new Error(translate('upload.editUnsupported'));

        context.imageSmoothingQuality = 'high';
        context.scale(scale, scale);
        // Crop area origin → rotated bounding box → image centre.
        context.translate(-area.x + bounds.width / 2, -area.y + bounds.height / 2);
        context.rotate((rotation * Math.PI) / 180);
        context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

        const type = OUTPUT_TYPES[file.type] ?? 'image/webp';
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, type, QUALITY),
        );
        if (!blob) throw new Error(translate('upload.saveFailed'));

        // Browsers without WebP encoding fall back to PNG; name the file after what we got.
        const extension = blob.type.split('/')[1] ?? 'png';
        const name = `${file.name.replace(/\.[^.]+$/, '') || 'image'}.${extension}`;

        return new File([blob], name, { type: blob.type });
    } finally {
        URL.revokeObjectURL(src);
    }
}
