'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { CollectionItem } from '@/entities/collection/model/types';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toItemDraft } from '@/entities/collection/model/drafts';
import { ItemFormDialog } from '../ItemFormDialog';
import { useItemMutations } from '../../model/useItemMutations';

type ItemActionsProps = {
    collectionId: number;
    item: CollectionItem;
    /** The last item cannot be deleted. */
    canDelete: boolean;
};

/** Owner's edit / delete controls on an item card. */
export function ItemActions({ collectionId, item, canDelete }: ItemActionsProps) {
    const { update, remove } = useItemMutations(collectionId);
    const [editing, setEditing] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    return (
        <>
            <Tooltip title="Edit item">
                <IconButton
                    size="small"
                    color="inherit"
                    onClick={() => setEditing(true)}
                    aria-label="Edit item"
                >
                    <EditOutlinedIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {canDelete && (
                <Tooltip title="Delete item">
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => setConfirmingDelete(true)}
                        aria-label="Delete item"
                    >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {editing && (
                <ItemFormDialog
                    mode="edit"
                    initial={toItemDraft(item)}
                    pending={update.isPending}
                    onClose={() => setEditing(false)}
                    onSubmit={(payload) =>
                        update.mutate(
                            { itemId: item.id, payload },
                            { onSuccess: () => setEditing(false) },
                        )
                    }
                />
            )}

            <ConfirmDialog
                open={confirmingDelete}
                title={`Delete “${item.title}”?`}
                description="This item will be removed from the collection."
                confirmLabel="Delete"
                destructive
                pending={remove.isPending}
                onClose={() => setConfirmingDelete(false)}
                onConfirm={() =>
                    remove.mutate(item.id, { onSuccess: () => setConfirmingDelete(false) })
                }
            />
        </>
    );
}
