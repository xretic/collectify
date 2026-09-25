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

/** Tags of a category, most used first, with removal for spam. */
export function CategoryTags({ categoryId }: { categoryId: number }) {
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const [deleting, setDeleting] = useState<Tag | null>(null);
    const tags = useTagSearch(categoryId, input);

    const remove = useMutation({
        mutationFn: (tagId: number) => tagApi.delete(tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
            toast.success('Tag deleted.');
            setDeleting(null);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <Section title="Tags" hint="Created by users, ranked by how many collections use them.">
            <SearchField value={input} onChange={setInput} placeholder="Find a tag" />

            {tags.data?.length === 0 && <EmptyState title="No tags" />}

            <ul className={styles.list}>
                {tags.data?.map((tag) => (
                    <li key={tag.id} className={styles.row}>
                        <span className={styles.name}>#{tag.name}</span>
                        <span className={styles.usage}>{tag.usageCount} collections</span>
                        <Tooltip title="Delete tag">
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleting(tag)}
                                aria-label={`Delete ${tag.name}`}
                            >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </li>
                ))}
            </ul>

            <ConfirmDialog
                open={deleting !== null}
                title={`Delete #${deleting?.name}?`}
                description="The tag is removed from every collection that uses it."
                confirmLabel="Delete"
                destructive
                pending={remove.isPending}
                onClose={() => setDeleting(null)}
                onConfirm={() => deleting && remove.mutate(deleting.id)}
            />
        </Section>
    );
}
