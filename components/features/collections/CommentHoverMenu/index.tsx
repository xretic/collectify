'use client';

import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import Menu from '@mui/material/Menu';
import { useUIStore } from '@/shared/model/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useCollectionStore } from '@/entities/collection/model/collectionStore';
import { useCommentEditStore } from '@/features/comment/edit/model/commentEditStore';
import { commentApi } from '@/entities/comment/api/commentApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { CollectionPropsAdditional } from '@/entities/collection/model/types';

type Props = {
    collectionId: string | number;
};

export default function CommentHoverMenu({ collectionId }: Props) {
    const queryClient = useQueryClient();

    const { commentAnchorEl, setCommentAnchorEl, startLoading, stopLoading, commentId } =
        useUIStore();
    const { comments, setComments } = useCollectionStore();
    const { setEditingComment } = useCommentEditStore();

    const open = Boolean(commentAnchorEl);

    const handleClose = () => {
        setCommentAnchorEl(null);
    };

    const commentsKey = collectionQueryKeys.comments(collectionId);

    const handleDelete = async () => {
        startLoading();

        try {
            handleClose();

            if (!commentId) return;

            await commentApi.delete(commentId);

            if (comments) setComments(comments.filter((c) => c.id !== commentId));

            queryClient.setQueryData<{ pages: CollectionPropsAdditional[] }>(commentsKey, (old) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((p) => ({
                        ...p,
                        commentsRes: (p.commentsRes ?? []).filter((c) => c.id !== commentId),
                    })),
                };
            });

            queryClient.invalidateQueries({ queryKey: collectionQueryKeys.detail(collectionId) });
        } finally {
            stopLoading();
        }
    };

    const handleEdit = () => {
        if (commentId) setEditingComment(commentId);
        setCommentAnchorEl(null);
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
