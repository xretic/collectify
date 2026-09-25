'use client';

import { useState, type DragEvent } from 'react';
import { CircularProgress } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useImagePicker } from '@/shared/lib/hooks/useImagePicker';
import type { ImageCropOptions } from '@/shared/model/imageEditorStore';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type ImageDropzoneProps = {
    value: string | null;
    onChange: (url: string) => void;
    label?: string;
    /** Crop applied in the editor before upload; free by default. */
    crop?: ImageCropOptions;
};

/** Click-or-drop upload area with a preview of the current image. */
export function ImageDropzone({ value, onChange, label, crop }: ImageDropzoneProps) {
    const t = useTranslations('imageDropzone');
    const { pick, upload, pending } = useImagePicker(onChange, crop);
    const [dragging, setDragging] = useState(false);

    const onDragOver = (event: DragEvent) => {
        event.preventDefault();
        if (!pending) setDragging(true);
    };

    const onDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragging(false);

        const file = event.dataTransfer.files[0];
        if (file && !pending) upload(file);
    };

    return (
        <button
            type="button"
            className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
            onClick={pick}
            onDragOver={onDragOver}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            disabled={pending}
        >
            {pending && <CircularProgress size={32} />}

            {!pending && value && <img className={styles.preview} src={value} alt="" />}

            {!pending && !value && (
                <span className={styles.placeholder}>
                    <AddPhotoAlternateOutlinedIcon className={styles.icon} />
                    <span className={styles.label}>{label ?? t('label')}</span>
                    <span className={styles.hint}>{t('hint')}</span>
                </span>
            )}
        </button>
    );
}
