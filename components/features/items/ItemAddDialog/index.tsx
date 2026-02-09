import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useDialogStore } from '@/stores/dialogs/dialogStore';
import { ConfigProvider, Input } from 'antd';
import styles from './index.module.css';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/lib/constans';
import TextArea from 'antd/es/input/TextArea';
import { IconButton, Snackbar, SnackbarCloseReason, SxProps, Theme } from '@mui/material';
import React, { useState } from 'react';
import { isValidUrl } from '@/helpers/isValidUrl';
import { useCollectionStore } from '@/stores/collectionStore';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '@/lib/api';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { useQueryClient } from '@tanstack/react-query';

type State = {
    title: string;
    description: string;
    sourceUrl: string;
};

export function ItemAddDialog() {
    const { open, setOpen } = useDialogStore();
    const [state, setState] = useState<State>({
        title: '',
        description: '',
        sourceUrl: '',
    });
    const { collection, setCollection } = useCollectionStore();
    const [errorMessage, setErrorMessage] = useState('');
    const [disabled, setDisabled] = useState(false);
    const queryClient = useQueryClient();

    const buttonsStyle: SxProps<Theme> = {
        borderRadius: 6,
        textTransform: 'none',
        color: 'var(--text-color)',
    };

    const updateState = <K extends keyof State>(key: K, value: State[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async () => {
        setDisabled(true);

        try {
            const data = await api
                .post(`api/collections/${collection?.id}/items`, {
                    json: {
                        title: state.title,
                        description: state.description,
                        sourceUrl: state.sourceUrl === '' ? null : state.sourceUrl,
                    },
                })
                .json<{ data: CollectionPropsAdditional }>();

            setState({ title: '', description: '', sourceUrl: '' });
            handleClose();
            setCollection(data.data);

            queryClient.removeQueries({
                predicate: (query) =>
                    query.queryKey.includes('collection') ||
                    query.queryKey.includes('collections-search'),
            });
        } catch (err: any) {
            const message = err?.response?.message;
            if (message) setErrorMessage(message);
        } finally {
            setDisabled(false);
        }
    };

    const handleSnackClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') {
            return;
        }

        setErrorMessage('');
    };

    const action = (
        <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

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
            <Snackbar
                open={errorMessage.length > 0}
                autoHideDuration={3000}
                onClose={handleSnackClose}
                message={errorMessage}
                action={action}
            />

            <DialogTitle className={styles.title} sx={{ color: 'var(--text-color)' }}>
                Add item
            </DialogTitle>

            <DialogContent>
                <DialogContentText
                    className={styles.description}
                    sx={{ color: 'var(--soft-text)' }}
                >
                    Add a new item to your collection. Fill in the required fields and save to keep
                    everything organized.
                </DialogContentText>

                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--soft-text)',
                        },
                    }}
                >
                    <p className={styles.paragraph}>Source URL (optional)</p>
                    <Input
                        onChange={(e) => updateState('sourceUrl', e.target.value)}
                        placeholder="Enter URL"
                        className={styles.input}
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                        }}
                        type="url"
                    />

                    <p className={styles.paragraph}>Title</p>
                    <Input
                        onChange={(e) => updateState('title', e.target.value)}
                        placeholder="Enter title"
                        className={styles.input}
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                        }}
                        maxLength={ITEM_TITLE_MAX_LENGTH}
                        showCount
                    />

                    <p className={styles.paragraph}>Description</p>
                    <TextArea
                        onChange={(e) => updateState('description', e.target.value)}
                        placeholder="Enter description"
                        className={styles.input}
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                            height: 70,
                            resize: 'none',
                        }}
                        maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                        showCount
                    />
                </ConfigProvider>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} sx={buttonsStyle}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={
                        disabled ||
                        state.title === '' ||
                        state.description === '' ||
                        (state.sourceUrl !== '' && !isValidUrl(state.sourceUrl))
                    }
                    sx={buttonsStyle}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}
