'use client';

import { useMemo, useState } from 'react';
import { Autocomplete, Chip, CircularProgress, TextField } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { useCategories } from '@/entities/category/model/useCategories';
import type { Tag, TagRef } from '@/entities/tag/model/types';
import { useTags } from '@/entities/tag/model/useTag';
import { useTagSearch } from '@/entities/tag/model/useTagSearch';
import { FEED_TAGS_LIMIT } from '@/shared/lib/constants';
import { formatCompact } from '@/shared/lib/format/number';
import styles from './index.module.css';

/** Suggestions are full tags; selected ones from the URL may only be refs. */
type Option = TagRef & Partial<Tag>;

type TagFilterProps = {
    /** Scope of the suggestions; `null` searches every category. */
    categoryId: number | null;
    value: number[];
    onChange: (tagIds: number[]) => void;
};

/**
 * Feed filter by up to `FEED_TAGS_LIMIT` tags (a collection must have all of
 * them). Suggestions come from the selected category (or the category of the
 * first picked tag), otherwise from all categories with the category name
 * shown next to each tag.
 */
export function TagFilter({ categoryId, value, onChange }: TagFilterProps) {
    const [input, setInput] = useState('');
    const selected = useTags(value);
    // Tags are per category and a collection has one, so once a tag is picked
    // the rest must come from its category (otherwise nothing could match).
    const scopeId = categoryId ?? selected.find(Boolean)?.categoryId ?? null;
    const search = useTagSearch(scopeId, input, true);
    const { categories } = useCategories();

    const categoryNames = useMemo(
        () => new Map(categories.map((category) => [category.id, category.name])),
        [categories],
    );

    // Tags from the URL are resolved lazily; show a placeholder until they load.
    const selectedTags: Option[] = value.map((id, index) => selected[index] ?? { id, name: '…' });
    const selectedIds = new Set(value);
    const options = (search.data ?? []).filter((tag) => !selectedIds.has(tag.id));
    const full = value.length >= FEED_TAGS_LIMIT;

    return (
        <Autocomplete<Option, true, true, false>
            multiple
            autoHighlight
            disableClearable
            filterSelectedOptions
            className={styles.field}
            value={selectedTags}
            options={full ? [] : options}
            inputValue={input}
            onInputChange={(_, next, reason) => reason !== 'reset' && setInput(next)}
            filterOptions={(items) => items}
            isOptionEqualToValue={(option, tag) => option.id === tag.id}
            // Names repeat across categories; ids do not.
            getOptionKey={(option) => option.id}
            getOptionLabel={(option) => option.name}
            onChange={(_, next) => {
                onChange(next.map((tag) => tag.id));
                setInput('');
            }}
            loading={search.isFetching}
            noOptionsText={
                full ? `Up to ${FEED_TAGS_LIMIT} tags` : input ? 'No matching tags' : 'No tags yet'
            }
            renderValue={(tags, getItemProps) =>
                tags.map((tag, index) => {
                    const { key, ...itemProps } = getItemProps({ index });
                    return (
                        <Chip
                            key={key}
                            {...itemProps}
                            size="small"
                            color="primary"
                            label={`#${tag.name}`}
                        />
                    );
                })
            }
            renderOption={({ key, ...props }, option) => (
                <li key={key} {...props}>
                    <span className={styles.option}>
                        <span className={styles.name}>
                            #{option.name}
                            {scopeId === null && option.categoryId && (
                                <span className={styles.category}>
                                    {categoryNames.get(option.categoryId)}
                                </span>
                            )}
                        </span>
                        {option.usageCount !== undefined && (
                            <span className={styles.usage}>{formatCompact(option.usageCount)}</span>
                        )}
                    </span>
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    placeholder={value.length === 0 ? 'Search by tags' : ''}
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
                                    {search.isFetching && <CircularProgress size={16} />}
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
