'use client';

import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import Menu from '@mui/material/Menu';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useCollectionStore } from '@/stores/collectionStore';

type Props = {
    collectionId: string | number;
    commentId: number;
};

export default function CommentHoverMenu({ collectionId, commentId }: Props) {
    const queryClient = useQueryClient();

    const { commentAnchorEl, setCommentAnchorEl, startLoading, stopLoading } = useUIStore();
    const { comments, setComments } = useCollectionStore();

    const open = Boolean(commentAnchorEl);

    const handleClose = () => {
        setCommentAnchorEl(null);
    };

    const commentsKey = ['collection-comments', String(collectionId)] as const;

    const handleDelete = async () => {
        startLoading();

        try {
            handleClose();

            await api.delete(`api/comments/${commentId}`);

            if (comments) setComments(comments.filter((c: any) => c.id !== commentId));

            queryClient.setQueryData(commentsKey, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((p: any) => ({
                        ...p,
                        commentsRes: (p.commentsRes ?? []).filter((c: any) => c.id !== commentId),
                    })),
                };
            });

            queryClient.invalidateQueries({ queryKey: ['collection', String(collectionId)] });
        } finally {
            stopLoading();
        }
    };

    const handleEdit = () => {
        // TODO: edit
    };

    return (
        <Menu
            anchorEl={commentAnchorEl}
            open={open}
            onClose={() => handleClose()}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: 'var(--container-color)',
                        borderRadius: 3,
                        boxShadow: 'none',
                    },
                },
            }}
        >
            <MenuItem sx={{ color: 'var(--text-color)' }} onClick={handleEdit}>
                <ListItemIcon sx={{ color: 'var(--text-color)' }}>
                    <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Edit
            </MenuItem>
            <MenuItem
                onClick={handleDelete}
                sx={{
                    color: 'error.main',
                    '&:hover': {
                        backgroundColor: 'light',
                    },
                }}
            >
                <ListItemIcon sx={{ color: 'error.main' }}>
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Delete
            </MenuItem>
        </Menu>
    );
}
