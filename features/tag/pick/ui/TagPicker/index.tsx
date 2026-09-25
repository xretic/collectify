'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Autocomplete, Chip, CircularProgress, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { tagApi } from '@/entities/tag/api/tagApi';
import { tagQueryKeys } from '@/entities/tag/model/queryKeys';
import { normalizeTagName, tagNameSchema } from '@/entities/tag/model/schemas';
import type { Tag, TagRef } from '@/entities/tag/model/types';
import { useTagSearch } from '@/entities/tag/model/useTagSearch';
import { COLLECTION_TAGS_LIMIT } from '@/shared/lib/constants';
import { formatCompact } from '@/shared/lib/format/number';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import styles from './index.module.css';

type Option = Tag | { create: string };

type TagPickerProps = {
    categoryId: number | null;
    value: TagRef[];
    onChange: (tags: TagRef[]) => void;
};

const isCreate = (option: Option): option is { create: string } => 'create' in option;

/**
 * Up to `COLLECTION_TAGS_LIMIT` tags of the chosen category. Suggestions come
 * from the server (typed text first, then popularity); unknown tags can be
 * created on the spot and become available to everyone.
 */
export function TagPicker({ categoryId, value, onChange }: TagPickerProps) {
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const search = useTagSearch(categoryId, input);

    const full = value.length >= COLLECTION_TAGS_LIMIT;
    const selectedIds = new Set(value.map((tag) => tag.id));

    const create = useMutation({
        mutationFn: (name: string) => tagApi.create(categoryId!, name),
        onSuccess: (tag) => {
            queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
            add(tag);
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    function add(tag: TagRef) {
        if (!selectedIds.has(tag.id) && !full) onChange([...value, { id: tag.id, name: tag.name }]);
        setInput('');
    }

    const suggestions = (search.data ?? []).filter((tag) => !selectedIds.has(tag.id));
    const typed = tagNameSchema.safeParse(input);
    const exists = (search.data ?? []).some(
        (tag) => normalizeTagName(tag.name) === normalizeTagName(input),
    );
    const options: Option[] =
        typed.success && !exists && !search.isFetching
            ? [...suggestions, { create: typed.data }]
            : suggestions;

    const disabled = categoryId === null;

    return (
        <Autocomplete<Option, true, true, false>
            multiple
            autoHighlight
            disableClearable
            filterSelectedOptions
            value={value as Option[]}
            options={options}
            inputValue={input}
            onInputChange={(_, next, reason) => reason !== 'reset' && setInput(next)}
            filterOptions={(items) => items}
            isOptionEqualToValue={(option, selected) =>
                !isCreate(option) && !isCreate(selected) && option.id === selected.id
            }
            getOptionLabel={(option) => (isCreate(option) ? option.create : option.name)}
            onChange={(_, next, reason, details) => {
                if (reason === 'removeOption') {
                    onChange(next.filter((option): option is Tag => !isCreate(option)));
                    return;
                }

                const option = details?.option;
                if (!option) return;

                if (isCreate(option)) create.mutate(option.create);
                else add(option);
            }}
            loading={search.isFetching || create.isPending}
            disabled={disabled}
            readOnly={full}
            noOptionsText={input ? 'No matching tags' : 'No tags in this category yet'}
            renderValue={(selected, getItemProps) =>
                selected.map((option, index) => {
                    const { key, ...itemProps } = getItemProps({ index });
                    return (
                        <Chip
                            key={key}
                            {...itemProps}
                            size="small"
                            label={isCreate(option) ? option.create : option.name}
                        />
                    );
                })
            }
            renderOption={({ key, ...props }, option) => (
                <li key={key} {...props}>
                    {isCreate(option) ? (
                        <span className={styles.create}>
                            <AddIcon fontSize="small" />
                            Create “{option.create}”
                        </span>
                    ) : (
                        <span className={styles.option}>
                            <span>{option.name}</span>
                            <span className={styles.usage}>{formatCompact(option.usageCount)}</span>
                        </span>
                    )}
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Tags"
                    placeholder={full ? '' : 'Search or create tags'}
                    helperText={
                        disabled
                            ? 'Choose a category first.'
                            : `${value.length} / ${COLLECTION_TAGS_LIMIT} · Popular tags of the category are suggested first.`
                    }
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            startAdornment: (
                                <>
                                    <LocalOfferOutlinedIcon className={styles.icon} />
                                    {params.InputProps.startAdornment}
                                </>
                            ),
                            endAdornment: (
                                <>
                                    {(search.isFetching || create.isPending) && (
                                        <CircularProgress size={18} />
                                    )}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}
