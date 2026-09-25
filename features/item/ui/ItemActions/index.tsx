'use client';

import { useState } from 'react';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { CollectionItem } from '@/entities/collection/model/types';
import { toItemDraft } from '@/entities/collection/model/drafts';
import { ActionsMenu, type ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { ItemFormDialog } from '../ItemFormDialog';
import { useItemMutations } from '../../model/useItemMutations';
import { useTranslations } from 'next-intl';

type ItemActionsProps = {
    collectionId: number;
    item: CollectionItem;
    /** The last item cannot be deleted. */
    canDelete: boolean;
};

/** Owner's "⋯" menu on an item card: edit / delete. */
export function ItemActions({ collectionId, item, canDelete }: ItemActionsProps) {
    const t = useTranslations('items');
    const tc = useTranslations('common');
    const { update, remove } = useItemMutations(collectionId);
    const [editing, setEditing] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const items: ActionsMenuItem[] = [
        {
            key: 'edit',
            label: t('edit'),
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: () => setEditing(true),
        },
    ];

    if (canDelete) {
        items.push({
            key: 'delete',
            label: t('delete'),
            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
            onClick: () => setConfirmingDelete(true),
            danger: true,
        });
    }

    return (
        <>
            <ActionsMenu items={items} label={t('actions')} />

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
                title={item.title ? t('deleteTitle', { title: item.title }) : t('deleteUntitled')}
                description={t('deleteDescription')}
                confirmLabel={tc('delete')}
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
