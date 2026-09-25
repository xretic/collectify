'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import type { CollectionDetails } from '@/entities/collection/model/types';
import { useCollectionCache } from '@/entities/collection/model/useCollectionDetails';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { toast } from '@/shared/model/toastStore';
import { toCollectionDraft, toCollectionPayload } from '@/entities/collection/model/drafts';
import { CollectionDetailsFields } from '@/entities/collection/ui/CollectionDetailsFields';
import { CategorySelect } from '@/entities/category/ui/CategorySelect';
import { TagPicker } from '@/features/tag/pick/ui/TagPicker';
import styles from './index.module.css';

type CollectionEditDialogProps = {
    collection: CollectionDetails;
    onClose: () => void;
};

/** Mount only while open so the form starts from the current collection. */
export function CollectionEditDialog({ collection, onClose }: CollectionEditDialogProps) {
    const cache = useCollectionCache(collection.id);
    const [draft, setDraft] = useState(() => toCollectionDraft(collection));
    const payload = toCollectionPayload(draft);

    const save = useMutation({
        mutationFn: () => collectionApi.update(collection.id, payload!),
        onSuccess: (updated) => {
            cache.update(() => updated);
            cache.invalidateLists();
            toast.success('Collection updated.');
            onClose();
        },
        onError: async (error) => toast.error(await getApiErrorMessage(error)),
    });

    return (
        <Dialog open onClose={save.isPending ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit collection</DialogTitle>

            <DialogContent className={styles.content}>
                <DialogContentText color="inherit" className={styles.intro}>
                    Changes are saved immediately and visible to other users. Items are edited right
                    on the collection page.
                </DialogContentText>

                <CollectionDetailsFields value={draft} onChange={setDraft} />

                <CategorySelect
                    required
                    value={draft.categoryId}
                    // Tags belong to a category, so switching it clears them.
                    onChange={(categoryId) =>
                        setDraft({
                            ...draft,
                            categoryId,
                            tags: categoryId === draft.categoryId ? draft.tags : [],
                        })
                    }
                />

                <TagPicker
                    categoryId={draft.categoryId}
                    value={draft.tags}
                    onChange={(tags) => setDraft({ ...draft, tags })}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={save.isPending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => save.mutate()}
                    disabled={!payload || save.isPending}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
