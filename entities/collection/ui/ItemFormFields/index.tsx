'use client';

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
import { useTranslations } from 'next-intl';
import { useValidationMessage } from '@/shared/i18n/useValidationMessage';

type ItemFormFieldsProps = {
    value: ItemDraft;
    onChange: (value: ItemDraft) => void;
};

export function ItemFormFields({ value, onChange }: ItemFormFieldsProps) {
    const t = useTranslations('items');
    const validationMessage = useValidationMessage();
    const set = <K extends keyof ItemDraft>(key: K, fieldValue: ItemDraft[K]) =>
        onChange({ ...value, [key]: fieldValue });

    const urlInvalid = isSourceUrlInvalid(value);
    const hasImage = value.imageUrl.trim() !== '';

    return (
        <div className={styles.fields}>
            <div className={styles.field}>
                <span className={styles.label}>{t('image')}</span>
                <ImageDropzone
                    value={value.imageUrl || null}
                    onChange={(url) => set('imageUrl', url)}
                />
            </div>

            <CountedTextField
                label={t('title')}
                value={value.title}
                onChange={(title) => set('title', title)}
                maxLength={ITEM_TITLE_MAX_LENGTH}
                required={!hasImage}
                helperText={hasImage ? undefined : t('titleRequired')}
                fullWidth
            />

            <CountedTextField
                label={t('description')}
                value={value.description}
                onChange={(description) => set('description', description)}
                maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                multiline
                minRows={2}
                maxRows={6}
                fullWidth
            />

            <TextField
                label={t('sourceUrl')}
                type="url"
                value={value.sourceUrl}
                onChange={(event) => set('sourceUrl', event.target.value)}
                error={urlInvalid}
                helperText={urlInvalid ? validationMessage('validation.urlInvalid') : undefined}
                fullWidth
            />

            <div className={styles.field}>
                <span className={styles.label}>{t('cardSize')}</span>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={value.size}
                    onChange={(_, size: ItemSize | null) => size && set('size', size)}
                    aria-label={t('cardSize')}
                >
                    {ITEM_SIZES.map((size) => (
                        <ToggleButton
                            key={size}
                            value={size}
                            className={styles.size}
                            title={t(`sizes.${size}`)}
                        >
                            {size}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <span className={styles.hint}>{t(`sizes.${value.size}`)}</span>
            </div>
        </div>
    );
}
