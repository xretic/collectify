'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconButton, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { tagApi } from '@/entities/tag/api/tagApi';
import { tagQueryKeys } from '@/entities/tag/model/queryKeys';
import type { Tag } from '@/entities/tag/model/types';
import { useTagSearch } from '@/entities/tag/model/useTagSearch';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SearchField } from '@/shared/ui/SearchField';
import { Section } from '../Section';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Tags of a category, most used first, with removal for spam. */
export function CategoryTags({ categoryId }: { categoryId: number }) {
    const t = useTranslations('management.tags');
    const tc = useTranslations('common');
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const [deleting, setDeleting] = useState<Tag | null>(null);
    const tags = useTagSearch(categoryId, input);

    const remove = useMutation({
        mutationFn: (tagId: number) => tagApi.delete(tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
            toast.success(t('deleted'));
            setDeleting(null);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <Section title={t('title')} hint={t('hint')}>
            <SearchField value={input} onChange={setInput} placeholder={t('search')} />

            {tags.data?.length === 0 && <EmptyState title={t('empty')} />}

            <ul className={styles.list}>
                {tags.data?.map((tag) => (
                    <li key={tag.id} className={styles.row}>
                        <span className={styles.name}>#{tag.name}</span>
                        <span className={styles.usage}>
                            {t('usage', { count: tag.usageCount })}
                        </span>
                        <Tooltip title={t('delete')}>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleting(tag)}
                                aria-label={t('deleteNamed', { name: tag.name })}
                            >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </li>
                ))}
            </ul>

            <ConfirmDialog
                open={deleting !== null}
                title={t('deleteTitle', { name: deleting?.name ?? '' })}
                description={t('deleteDescription')}
                confirmLabel={tc('delete')}
                destructive
                pending={remove.isPending}
                onClose={() => setDeleting(null)}
                onConfirm={() => deleting && remove.mutate(deleting.id)}
            />
        </Section>
    );
}
