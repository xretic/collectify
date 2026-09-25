'use client';

import { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { ActionsMenu, type ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('comments');
    const tc = useTranslations('common');
    const [confirming, setConfirming] = useState(false);

    const items: ActionsMenuItem[] = [];

    if (canEdit) {
        items.push({
            key: 'edit',
            label: tc('edit'),
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: onEdit,
        });
    }

    if (canDelete) {
        items.push({
            key: 'delete',
            label: asModerator ? t('deleteAsModerator') : tc('delete'),
            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
            onClick: () => setConfirming(true),
            danger: true,
        });
    }

    items.push(...extraItems);

    return (
        <>
            <ActionsMenu items={items} label={t('actions')} />

            <ConfirmDialog
                open={confirming}
                title={t('deleteTitle')}
                confirmLabel={tc('delete')}
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
