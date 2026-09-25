'use client';

import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { ActionsMenu, type ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

type CommentMenuProps = {
    canEdit: boolean;
    canDelete: boolean;
    /** Staff deleting someone else's comment. */
    asModerator: boolean;
    deleting: boolean;
    onEdit: () => void;
    onDelete: () => void;
    /** Extra entries, e.g. "Report comment". */
    extraItems?: ActionsMenuItem[];
};

/** Per-comment actions menu: its own anchor, so only the clicked menu opens. */
export function CommentMenu({
    canEdit,
    canDelete,
    asModerator,
    deleting,
    onEdit,
    onDelete,
    extraItems = [],
}: CommentMenuProps) {
    const [confirming, setConfirming] = useState(false);

    const items: ActionsMenuItem[] = [];

    if (canEdit) {
        items.push({
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: onEdit,
        });
    }

    if (canDelete) {
        items.push({
            key: 'delete',
            label: asModerator ? 'Delete as moderator' : 'Delete',
            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
            onClick: () => setConfirming(true),
            danger: true,
        });
    }

    items.push(...extraItems);

    return (
        <>
            <ActionsMenu items={items} label="Comment actions" />

            <ConfirmDialog
                open={confirming}
                title="Delete this comment?"
                confirmLabel="Delete"
                destructive
                pending={deleting}
                onClose={() => setConfirming(false)}
                onConfirm={() => {
                    onDelete();
                    setConfirming(false);
                }}
            />
        </>
    );
}
