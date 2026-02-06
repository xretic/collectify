import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import styles from './index.module.css';
import { useState } from 'react';
import { useCollectionStore } from '@/stores/collectionStore';
import { SxProps } from '@mui/material';
import { Theme } from '@mui/system';
import { useDeleteDialogStore } from '@/stores/deleteDialogStore';
import { useRouter } from 'next/navigation';

export function CollectionDeleteDialog() {
    const { open, setOpenDialog } = useDeleteDialogStore();
    const { collection, setCollection } = useCollectionStore();
    const [disabled, setDisabled] = useState(false);
    const router = useRouter();

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

        const res = await fetch('/api/collections/' + collection?.id + '/delete', {
            method: 'DELETE',
        });

        if (!res.ok) return;

        setCollection(null);
        handleClose();
        setDisabled(false);

        router.replace('/');
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
