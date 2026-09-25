// Direct upload to Uploadcare's Upload API: no third-party widget script,
// the user gets the native file picker on click.

import { editImage, type ImageCropOptions } from '@/shared/model/imageEditorStore';

const UPLOAD_URL = 'https://upload.uploadcare.com/base/';

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

const publicKey = () => process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY?.trim() ?? '';

let cdnBase: Promise<string> | null = null;

/**
 * Projects are served from `https://<prefix>.ucarecd.net`, where the prefix is
 * the first 10 base-36 digits of SHA-256(public key) — the same derivation as
 * Uploadcare's `@uploadcare/cname-prefix`. (The legacy `ucarecdn.com` host
 * returns 404 for newer projects.)
 */
function getCdnBase(key: string): Promise<string> {
    cdnBase ??= crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)).then((digest) => {
        const hex = [...new Uint8Array(digest)]
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
        return `https://${BigInt(`0x${hex}`).toString(36).slice(0, 10)}.ucarecd.net`;
    });

    return cdnBase;
}

/** Opens the native file dialog; resolves with the chosen file or `null` if cancelled. */
function chooseFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ACCEPTED_TYPES.join(',');
        input.hidden = true;
        // Some browsers (Safari) ignore detached file inputs.
        document.body.appendChild(input);

        let settled = false;
        const finish = (file: File | null) => {
            if (settled) return;
            settled = true;
            window.removeEventListener('focus', onFocus);
            input.remove();
            resolve(file);
        };

        // Browsers without the `cancel` event: the window regains focus when the
        // dialog closes; if no file arrived shortly after, treat it as cancelled.
        const onFocus = () => setTimeout(() => finish(input.files?.[0] ?? null), 500);

        input.addEventListener('change', () => finish(input.files?.[0] ?? null));
        input.addEventListener('cancel', () => finish(null));
        window.addEventListener('focus', onFocus, { once: true });

        input.click();
    });
}

/** Throws a user-facing error for files that cannot be uploaded. */
export function assertUploadableImage(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Choose a PNG, JPG, WEBP or GIF image.');
    }
    if (file.size > IMAGE_MAX_BYTES) throw new Error('The image must be 10MB or smaller.');
}

/** Uploads an image and returns its CDN URL. */
export async function uploadImage(file: File): Promise<string> {
    const key = publicKey();
    if (!key) throw new Error('Image uploads are not configured.');

    assertUploadableImage(file);

    const body = new FormData();
    body.append('UPLOADCARE_PUB_KEY', key);
    body.append('UPLOADCARE_STORE', 'auto');
    body.append('file', file);

    let response: Response;

    try {
        response = await fetch(UPLOAD_URL, { method: 'POST', body });
    } catch {
        throw new Error('Image upload failed. Check your connection.');
    }

    if (!response.ok) throw new Error('Image upload failed.');

    const { file: uuid } = (await response.json()) as { file?: string };
    if (!uuid) throw new Error('Image upload failed.');

    return `${await getCdnBase(key)}/${uuid}/`;
}

/**
 * Lets the user crop / rotate `file` in the image editor, then uploads the
 * result; `null` when the editor is cancelled. GIFs are uploaded as they are,
 * since re-encoding would drop the animation.
 */
export async function editAndUploadImage(
    file: File,
    crop?: ImageCropOptions,
): Promise<string | null> {
    assertUploadableImage(file);
    if (file.type === 'image/gif') return uploadImage(file);

    const edited = await editImage(file, crop);
    return edited ? uploadImage(edited) : null;
}

/** Lets the user choose, edit and upload an image; `null` when any step is cancelled. */
export async function pickImage(crop?: ImageCropOptions): Promise<string | null> {
    const file = await chooseFile();
    return file ? editAndUploadImage(file, crop) : null;
}
