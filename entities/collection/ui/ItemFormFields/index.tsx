import { TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
    ITEM_DESCRIPTION_MAX_LENGTH,
    ITEM_SIZES,
    ITEM_TITLE_MAX_LENGTH,
} from '@/shared/lib/constants';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import { ImageDropzone } from '@/shared/ui/ImageDropzone';
import { isSourceUrlInvalid, type ItemDraft } from '../../model/drafts';
import type { ItemSize } from '../../model/types';
import styles from './index.module.css';

const SIZE_HINTS: Record<ItemSize, string> = {
    S: 'Small square tile',
    M: 'Tall tile, one column',
    L: 'Large tile, two columns',
    XL: 'Banner across the whole row',
};

type ItemFormFieldsProps = {
    value: ItemDraft;
    onChange: (value: ItemDraft) => void;
};

export function ItemFormFields({ value, onChange }: ItemFormFieldsProps) {
    const set = <K extends keyof ItemDraft>(key: K, fieldValue: ItemDraft[K]) =>
        onChange({ ...value, [key]: fieldValue });

    const urlInvalid = isSourceUrlInvalid(value);
    const hasImage = value.imageUrl.trim() !== '';

    return (
        <div className={styles.fields}>
            <div className={styles.field}>
                <span className={styles.label}>Image</span>
                <ImageDropzone
                    value={value.imageUrl || null}
                    onChange={(url) => set('imageUrl', url)}
                    label="Click or drop an image"
                />
            </div>

            <CountedTextField
                label="Title"
                value={value.title}
                onChange={(title) => set('title', title)}
                maxLength={ITEM_TITLE_MAX_LENGTH}
                required={!hasImage}
                helperText={hasImage ? undefined : 'Required when there is no image'}
                fullWidth
            />

            <CountedTextField
                label="Description"
                value={value.description}
                onChange={(description) => set('description', description)}
                maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
            />

            <TextField
                label="Source URL"
                type="url"
                value={value.sourceUrl}
                onChange={(event) => set('sourceUrl', event.target.value)}
                error={urlInvalid}
                helperText={urlInvalid ? 'Enter a valid http(s) URL.' : undefined}
                fullWidth
            />

            <div className={styles.field}>
                <span className={styles.label}>Card size</span>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={value.size}
                    onChange={(_, size: ItemSize | null) => size && set('size', size)}
                    aria-label="Card size"
                >
                    {ITEM_SIZES.map((size) => (
                        <ToggleButton
                            key={size}
                            value={size}
                            className={styles.size}
                            title={SIZE_HINTS[size]}
                        >
                            {size}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <span className={styles.hint}>{SIZE_HINTS[value.size]}</span>
            </div>
        </div>
    );
}
