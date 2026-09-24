import { TextField } from '@mui/material';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/shared/lib/constants';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { ImageDropzone } from '@/shared/ui/ImageDropzone';
import { isSourceUrlInvalid, type ItemDraft } from '../../model/drafts';
import styles from './index.module.css';

type ItemFormFieldsProps = {
    value: ItemDraft;
    onChange: (value: ItemDraft) => void;
};

export function ItemFormFields({ value, onChange }: ItemFormFieldsProps) {
    const set = <K extends keyof ItemDraft>(key: K, fieldValue: ItemDraft[K]) =>
        onChange({ ...value, [key]: fieldValue });

    const urlInvalid = isSourceUrlInvalid(value);

    return (
        <div className={styles.fields}>
            <div className={styles.field}>
                <span className={styles.label}>Cover image (optional)</span>
                <ImageDropzone
                    value={value.imageUrl || null}
                    onChange={(url) => set('imageUrl', url)}
                    label="Click to upload cover image"
                />
            </div>

            <TextField
                label="Source URL (optional)"
                type="url"
                value={value.sourceUrl}
                onChange={(event) => set('sourceUrl', event.target.value)}
                error={urlInvalid}
                helperText={urlInvalid ? 'Enter a valid http(s) URL.' : undefined}
                fullWidth
            />

            <CountedTextField
                label="Title"
                value={value.title}
                onChange={(title) => set('title', title)}
                maxLength={ITEM_TITLE_MAX_LENGTH}
                required
                fullWidth
            />

            <CountedTextField
                label="Description"
                value={value.description}
                onChange={(description) => set('description', description)}
                maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                required
                multiline
                minRows={2}
                maxRows={5}
                fullWidth
            />
        </div>
    );
}
