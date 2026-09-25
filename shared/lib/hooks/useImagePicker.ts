'use client';

import { useState } from 'react';
import { editAndUploadImage, pickImage } from '@/shared/lib/pickImage';
import type { ImageCropOptions } from '@/shared/model/imageEditorStore';
import { toast } from '@/shared/model/toastStore';
import { translate } from '@/shared/i18n/translator';

/**
 * `pick` opens the native file dialog, `upload` takes a file the user dropped;
 * either way the image goes through the editor (cropped to `crop`) before it
 * is uploaded. `pending` is always reset, even when a dialog is cancelled.
 */
export function useImagePicker(onPicked: (url: string) => void, crop?: ImageCropOptions) {
    const [pending, setPending] = useState(false);

    const run = async (task: () => Promise<string | null>) => {
        if (pending) return;
        setPending(true);

        try {
            const url = await task();
            if (url) onPicked(url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : translate('upload.failed'));
        } finally {
            setPending(false);
        }
    };

    return {
        pick: () => run(() => pickImage(crop)),
        upload: (file: File) => run(() => editAndUploadImage(file, crop)),
        pending,
    };
}
