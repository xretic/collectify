'use client';

import { useState } from 'react';
import { pickImage } from '@/shared/lib/pickImage';
import { toast } from '@/shared/model/toastStore';

/** Opens the upload dialog; `pending` is always reset, even when the dialog is cancelled. */
export function useImagePicker(onPicked: (url: string) => void) {
    const [pending, setPending] = useState(false);

    const pick = async () => {
        if (pending) return;
        setPending(true);

        try {
            const url = await pickImage();
            if (url) onPicked(url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Upload failed.');
        } finally {
            setPending(false);
        }
    };

    return { pick, pending };
}
