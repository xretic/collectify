'use client';

import { CircularProgress } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useImagePicker } from '@/shared/lib/hooks/useImagePicker';
import styles from './index.module.css';

type ImageDropzoneProps = {
    value: string | null;
    onChange: (url: string) => void;
    label?: string;
};

/** Click-to-upload area with a preview of the current image. */
export function ImageDropzone({
    value,
    onChange,
    label = 'Click to upload an image',
}: ImageDropzoneProps) {
    const { pick, pending } = useImagePicker(onChange);

    return (
        <button type="button" className={styles.dropzone} onClick={pick} disabled={pending}>
            {pending && <CircularProgress size={32} />}

            {!pending && value && <img className={styles.preview} src={value} alt="" />}

            {!pending && !value && (
                <span className={styles.placeholder}>
                    <AddPhotoAlternateOutlinedIcon className={styles.icon} />
                    <span className={styles.label}>{label}</span>
                    <span className={styles.hint}>PNG, JPG up to 10MB</span>
                </span>
            )}
        </button>
    );
}
