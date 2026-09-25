'use client';

import { useState } from 'react';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import type { Board } from '@/entities/board/model/types';
import type { ActionsMenuItem } from '@/shared/ui/ActionsMenu';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useBoardMutations } from '../../model/useBoardMutations';
import { BoardNameDialog } from '../BoardNameDialog';
import { useTranslations } from 'next-intl';

/**
 * Rename / delete for a board's "⋯" menu. Render `dialogs` outside the board tab,
 * so pointer events inside a dialog never reach the tab's drag handle.
 */
export function useBoardActions({ onDeleted }: { onDeleted: (board: Board) => void }) {
    const t = useTranslations('boards');
    const tc = useTranslations('common');
    const { rename, remove } = useBoardMutations();
    const [renaming, setRenaming] = useState<Board | null>(null);
    const [deleting, setDeleting] = useState<Board | null>(null);

    const items = (board: Board): ActionsMenuItem[] => [
        {
            key: 'rename',
            label: t('rename'),
            icon: <DriveFileRenameOutlineIcon fontSize="small" />,
            onClick: () => setRenaming(board),
        },
        {
            key: 'delete',
            label: t('delete'),
            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
            onClick: () => setDeleting(board),
            danger: true,
        },
    ];

    const dialogs = (
        <>
            {renaming && (
                <BoardNameDialog
                    title={t('renameTitle')}
                    initialName={renaming.name}
                    submitLabel={tc('save')}
                    pending={rename.isPending}
                    onClose={() => setRenaming(null)}
                    onSubmit={(name) =>
                        rename.mutate(
                            { boardId: renaming.id, name },
                            { onSuccess: () => setRenaming(null) },
                        )
                    }
                />
            )}

            <ConfirmDialog
                open={deleting !== null}
                title={t('deleteTitle', { name: deleting?.name ?? '' })}
                description={t('deleteDescription')}
                confirmLabel={tc('delete')}
                destructive
                pending={remove.isPending}
                onClose={() => setDeleting(null)}
                onConfirm={() =>
                    deleting &&
                    remove.mutate(deleting.id, {
                        onSuccess: () => {
                            setDeleting(null);
                            onDeleted(deleting);
                        },
                    })
                }
            />
        </>
    );

    return { items, dialogs };
}
