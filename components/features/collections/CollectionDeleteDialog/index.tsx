import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { useCollectionStore } from '@/entities/collection/model/collectionStore';
import { SxProps, Theme } from '@mui/material';
import { useDeleteDialogStore } from '@/features/collection/delete/model/deleteCollectionDialogStore';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';

export function CollectionDeleteDialog() {
    const { open, setOpenDialog } = useDeleteDialogStore();
    const { collection, setCollection } = useCollectionStore();
    const [disabled, setDisabled] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    const buttonsStyle: SxProps<Theme> = {
        borderRadius: 6,
        textTransform: 'none',
        color: 'var(--text-color)',
    };

    const handleClose = () => {
        setOpenDialog(false);
    };

    const handleSubmit = async () => {
        setDisabled(true);

        try {
            if (!collection) return;

            await collectionApi.delete(collection.id);

            setCollection(null);
            handleClose();

            queryClient.invalidateQueries({
                queryKey: collectionQueryKeys.search,
            });

            router.replace('/');
        } finally {
            setDisabled(false);
        }
    };

    return (
        <Dialog
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: 'var(--container-color)',
                        color: 'var(--text-color)',
                        borderRadius: 3,
                    },
                },
            }}
            open={open}
            onClose={handleClose}
        >
            <DialogTitle sx={{ color: 'var(--text-color)' }}>
                This action cannot be undone. Are you sure you want to delete this collection?
            </DialogTitle>

            <DialogActions>
                <Button onClick={handleClose} sx={buttonsStyle}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={disabled}
                    sx={buttonsStyle}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
