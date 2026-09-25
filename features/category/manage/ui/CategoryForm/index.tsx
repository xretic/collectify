'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, FormControlLabel, Switch, TextField } from '@mui/material';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { categoryQueryKeys } from '@/entities/category/model/queryKeys';
import { categorySchema, slugify } from '@/entities/category/model/schemas';
import type { CategoryPayload, ManagedCategory } from '@/entities/category/model/types';
import { CATEGORY_DESCRIPTION_MAX_LENGTH, CATEGORY_NAME_MAX_LENGTH } from '@/shared/lib/constants';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { CountedTextField } from '@/shared/ui/CountedTextField';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type CategoryFormProps = {
    /** `null` creates a new category. */
    category: ManagedCategory | null;
    onSaved: (category: ManagedCategory) => void;
    onDeleted: () => void;
};

const emptyDraft: CategoryPayload = {
    name: '',
    slug: '',
    description: '',
    position: 0,
    isActive: true,
};

/** Admin editor for one category. Mount with a `key` so it resets per category. */
export function CategoryForm({ category, onSaved, onDeleted }: CategoryFormProps) {
    const t = useTranslations('management.categories');
    const tc = useTranslations('common');
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState<CategoryPayload>(() =>
        category
            ? {
                  name: category.name,
                  slug: category.slug,
                  description: category.description,
                  position: category.position,
                  isActive: category.isActive,
              }
            : emptyDraft,
    );
    // New categories derive the slug from the name until it is edited by hand.
    const [slugTouched, setSlugTouched] = useState(Boolean(category));
    const [confirming, setConfirming] = useState(false);

    const parsed = categorySchema.safeParse(draft);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });

    const save = useMutation({
        mutationFn: () =>
            category
                ? categoryApi.update(category.id, parsed.data!)
                : categoryApi.create(parsed.data!),
        onSuccess: (saved) => {
            invalidate();
            toast.success(category ? t('updated') : t('created'));
            onSaved(saved);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const remove = useMutation({
        mutationFn: () => categoryApi.delete(category!.id),
        onSuccess: () => {
            invalidate();
            toast.success(t('deleted'));
            onDeleted();
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    const set = <K extends keyof CategoryPayload>(key: K, value: CategoryPayload[K]) =>
        setDraft((current) => ({ ...current, [key]: value }));

    return (
        <form
            className={styles.form}
            onSubmit={(event) => {
                event.preventDefault();
                if (parsed.success) save.mutate();
            }}
        >
            <CountedTextField
                label={t('name')}
                value={draft.name}
                onChange={(name) =>
                    setDraft((current) => ({
                        ...current,
                        name,
                        slug: slugTouched ? current.slug : slugify(name),
                    }))
                }
                maxLength={CATEGORY_NAME_MAX_LENGTH}
                required
                fullWidth
            />

            <TextField
                label={t('slug')}
                value={draft.slug}
                onChange={(event) => {
                    setSlugTouched(true);
                    set('slug', event.target.value);
                }}
                helperText={t('slugHint')}
                required
                fullWidth
            />

            <CountedTextField
                label={t('description')}
                value={draft.description}
                onChange={(description) => set('description', description)}
                maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
                multiline
                minRows={2}
                fullWidth
            />

            <div className={styles.row}>
                <TextField
                    label={t('position')}
                    type="number"
                    value={draft.position}
                    onChange={(event) => set('position', Math.max(0, Number(event.target.value)))}
                    helperText={t('positionHint')}
                    className={styles.position}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={draft.isActive}
                            onChange={(event) => set('isActive', event.target.checked)}
                        />
                    }
                    label={draft.isActive ? t('active') : t('archived')}
                />
            </div>

            <div className={styles.actions}>
                {category && (
                    <Button
                        color="error"
                        onClick={() => setConfirming(true)}
                        disabled={category.collections > 0 || remove.isPending}
                        title={category.collections > 0 ? t('onlyArchive') : undefined}
                    >
                        {tc('delete')}
                    </Button>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    disabled={!parsed.success || save.isPending}
                >
                    {category ? tc('save') : t('create')}
                </Button>
            </div>

            <ConfirmDialog
                open={confirming}
                title={t('deleteTitle', { name: category?.name ?? '' })}
                confirmLabel={tc('delete')}
                destructive
                pending={remove.isPending}
                onClose={() => setConfirming(false)}
                onConfirm={() => remove.mutate()}
            />
        </form>
    );
}
