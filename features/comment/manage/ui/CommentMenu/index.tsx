'use client';

import { useState, type MouseEvent } from 'react';
import { IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import styles from './index.module.css';

type CommentMenuProps = {
    canEdit: boolean;
    /** Staff deleting someone else's comment. */
    asModerator: boolean;
    deleting: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

/** Per-comment actions menu: its own anchor, so only the clicked menu opens. */
export function CommentMenu({
    canEdit,
    asModerator,
    deleting,
    onEdit,
    onDelete,
}: CommentMenuProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [confirming, setConfirming] = useState(false);

    const close = () => setAnchorEl(null);

    return (
        <>
            <IconButton
                size="small"
                color="inherit"
                onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
                aria-label="Comment actions"
                aria-haspopup="menu"
            >
                <MoreHorizIcon fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {canEdit && (
                    <MenuItem
                        onClick={() => {
                            close();
                            onEdit();
                        }}
                    >
                        <ListItemIcon>
                            <EditOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        Edit
                    </MenuItem>
                )}

                <MenuItem
                    className={styles.danger}
                    onClick={() => {
                        close();
                        setConfirming(true);
                    }}
                >
                    <ListItemIcon>
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    {asModerator ? 'Delete as moderator' : 'Delete'}
                </MenuItem>
            </Menu>

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
