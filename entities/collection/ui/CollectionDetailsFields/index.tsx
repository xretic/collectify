import { Button } from '@mui/material';
import {
    COLLECTION_DESCRIPTION_MAX_LENGTH,
    COLLECTION_NAME_MAX_LENGTH,
} from '@/shared/lib/constants';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { ImageDropzone } from '@/shared/ui/ImageDropzone';
import type { CollectionDraft } from '../../model/drafts';
import styles from './index.module.css';

type CollectionDetailsFieldsProps = {
    value: CollectionDraft;
    onChange: (value: CollectionDraft) => void;
};

/** Name, description, banner and visibility — shared by "create" and "edit". */
export function CollectionDetailsFields({ value, onChange }: CollectionDetailsFieldsProps) {
    const set = <K extends keyof CollectionDraft>(key: K, fieldValue: CollectionDraft[K]) =>
        onChange({ ...value, [key]: fieldValue });

    return (
        <div className={styles.fields}>
            <div className={styles.field}>
                <span className={styles.label}>Cover image</span>
                <ImageDropzone
                    value={value.bannerUrl || null}
                    onChange={(url) => set('bannerUrl', url)}
                    label="Click to upload cover image"
                />
            </div>

            <CountedTextField
                label="Title"
                value={value.name}
                onChange={(name) => set('name', name)}
                maxLength={COLLECTION_NAME_MAX_LENGTH}
                required
                fullWidth
            />

            <CountedTextField
                label="Description"
                value={value.description}
                onChange={(description) => set('description', description)}
                maxLength={COLLECTION_DESCRIPTION_MAX_LENGTH}
                required
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
            />

            <div className={styles.field}>
                <span className={styles.label}>Visibility</span>
                <div className={styles.row}>
                    <Button
                        variant={value.isPrivate ? 'outlined' : 'contained'}
                        onClick={() => set('isPrivate', false)}
                    >
                        Public
                    </Button>
                    <Button
                        variant={value.isPrivate ? 'contained' : 'outlined'}
                        onClick={() => set('isPrivate', true)}
                    >
                        Private
                    </Button>
                </div>
            </div>
        </div>
    );
}
