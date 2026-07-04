import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { ConfigProvider, Input } from 'antd';
import styles from './index.module.css';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/shared/lib/constants';
import TextArea from 'antd/es/input/TextArea';
import { Box, IconButton, Snackbar, SnackbarCloseReason, SxProps, Theme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useCollectionStore } from '@/entities/collection/model/collectionStore';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useQueryClient } from '@tanstack/react-query';
import { handleUpload } from '@/shared/lib/handleUpload';
import { isValidUrl } from '@/shared/lib/validation/isValidUrl';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { getApiErrorMessage } from '@/shared/api/getApiErrorMessage';
import { useItemEditDialogStore } from '@/features/item/edit/model/itemEditDialogStore';

type State = {
    title: string;
    description: string;
    sourceUrl: string;
    imageUrl: string;
};

const initialState: State = {
    title: '',
    description: '',
    sourceUrl: '',
    imageUrl: '',
};

export function ItemEditDialog() {
    const { open, item, closeItemEdit } = useItemEditDialogStore();
    const [state, setState] = useState<State>(initialState);
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
        closeItemEdit();
        setState(initialState);
        setErrorMessage('');
    };

    const handleSubmit = async () => {
        if (!collection || !item) return;

        setDisabled(true);

        try {
            const updatedCollection = await collectionApi.updateItem(collection.id, item.id, {
                title: state.title.trim(),
                description: state.description.trim(),
                sourceUrl: state.sourceUrl.trim() === '' ? null : state.sourceUrl.trim(),
                imageUrl: state.imageUrl.trim() === '' ? null : state.imageUrl.trim(),
            });

            setCollection(updatedCollection);
            queryClient.setQueryData(collectionQueryKeys.detail(collection.id), updatedCollection);
            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey.includes(collectionQueryKeys.search[0]) ||
                    query.queryKey.includes(collectionQueryKeys.mySearch[0]),
            });

            handleClose();
        } catch (err) {
            setErrorMessage(await getApiErrorMessage(err));
        } finally {
            setDisabled(false);
        }
    };

    const handleSnackClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === 'clickaway') return;

        setErrorMessage('');
    };

    useEffect(() => {
        if (!item) {
            setState(initialState);
            return;
        }

        setState({
            title: item.title,
            description: item.description,
            sourceUrl: item.sourceUrl ?? '',
            imageUrl: item.imageUrl ?? '',
        });
    }, [item]);

    const action = (
        <React.Fragment>
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackClose}>
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
                Edit item
            </DialogTitle>

            <DialogContent>
                <DialogContentText
                    className={styles.description}
                    sx={{ color: 'var(--soft-text)' }}
                >
                    Update item details. Changes are applied to this collection after saving.
                </DialogContentText>

                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--soft-text)',
                        },
                    }}
                >
                    <p className={styles.paragraph}>Cover image (Optional)</p>

                    <Box
                        onClick={() => handleUpload((url) => updateState('imageUrl', url))}
                        sx={{
                            border: '2px dashed var(--text-color)',
                            borderRadius: 2,
                            height: 220,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: '0.2s',
                            marginBottom: 3,

                            '&:hover': {
                                borderColor: 'var(--accent)',
                                backgroundColor: 'rgba(99,102,241,0.04)',
                            },
                        }}
                    >
                        {state.imageUrl ? (
                            <div className={styles.bannerWrapper}>
                                <img className={styles.banner} src={state.imageUrl} alt="cover" />
                            </div>
                        ) : (
                            <>
                                <AddPhotoAlternateOutlinedIcon
                                    sx={{ fontSize: 40, color: '#98A2B3', mb: 1 }}
                                />

                                <p className={styles.clickToUpload}>Click to upload cover image</p>
                                <p className={styles.secondary}>PNG, JPG up to 10MB</p>
                            </>
                        )}
                    </Box>

                    <p className={styles.paragraph}>Source URL (optional)</p>
                    <Input
                        onChange={(e) => updateState('sourceUrl', e.target.value)}
                        placeholder="Enter URL"
                        className={styles.input}
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                        }}
                        value={state.sourceUrl}
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
                        value={state.title}
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
                        }}
                        autoSize={{ minRows: 2, maxRows: 5 }}
                        value={state.description}
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
                        state.title.trim() === '' ||
                        state.description.trim() === '' ||
                        (state.sourceUrl.trim() !== '' && !isValidUrl(state.sourceUrl.trim()))
                    }
                    sx={buttonsStyle}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}
