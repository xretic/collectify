import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { ConfigProvider, Input } from 'antd';
import styles from './index.module.css';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/lib/constans';
import TextArea from 'antd/es/input/TextArea';
import { Box, IconButton, Snackbar, SnackbarCloseReason, SxProps, Theme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useCollectionStore } from '@/stores/collectionStore';
import CloseIcon from '@mui/icons-material/Close';
import { useEditingDialogStore } from '@/stores/dialogs/editCollectionDialogStore';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { api } from '@/lib/api';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { ItemField } from '../../items/ItemField';
import { handleUpload } from '@/helpers/handleUpload';

type State = {
    title: string;
    description: string;
    bannerUrl: string;
};

export function CollectionEditingDialog() {
    const { open, setOpenEditing } = useEditingDialogStore();
    const [state, setState] = useState<State>({
        title: '',
        description: '',
        bannerUrl: '',
    });
    const { collection, setCollection } = useCollectionStore();
    const [errorMessage, setErrorMessage] = useState('');
    const [disabled, setDisabled] = useState(false);

    const buttonsStyle: SxProps<Theme> = {
        borderRadius: 6,
        textTransform: 'none',
        color: 'var(--text-color)',
    };

    const updateState = <K extends keyof State>(key: K, value: State[K]) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const resetState = () => setState({ title: '', description: '', bannerUrl: '' });

    const handleClose = () => {
        setOpenEditing(false);

        if (!collection) return;

        setState({
            title: collection.name,
            description: collection.description,
            bannerUrl: collection.bannerUrl,
        });
    };
    const handleSubmit = async () => {
        setDisabled(true);

        try {
            const data = await api
                .patch(`api/collections/${collection?.id}/edit`, {
                    json: {
                        title: state.title,
                        description: state.description,
                        bannerUrl: state.bannerUrl === '' ? null : state.bannerUrl,
                    },
                })
                .json<{ data: CollectionPropsAdditional }>();

            resetState();
            handleClose();
            setCollection(data.data);
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

    useEffect(() => {
        if (!collection) return;

        setState({
            title: collection.name,
            description: collection.description,
            bannerUrl: collection.bannerUrl,
        });
    }, [collection]);

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
                Edit collection
            </DialogTitle>

            <DialogContent>
                <DialogContentText
                    className={styles.description}
                    sx={{ color: 'var(--soft-text)' }}
                >
                    Update your collection details below. Changes will be saved immediately and
                    visible to other users.
                </DialogContentText>

                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--soft-text)',
                        },
                    }}
                >
                    <p className={styles.paragraph}>Cover image</p>

                    <Box
                        onClick={() => handleUpload((url) => updateState('bannerUrl', url))}
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
                        {state.bannerUrl ? (
                            <div className={styles.bannerWrapper}>
                                <img className={styles.banner} src={state.bannerUrl} alt="cover" />
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
                            height: 70,
                            resize: 'none',
                        }}
                        value={state.description}
                        maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                        showCount
                    />

                    <p className={styles.paragraph}>Items</p>
                    {collection?.items.map((x) => (
                        <ItemField key={x.id} item={x} collection={collection} />
                    ))}
                </ConfigProvider>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} sx={buttonsStyle}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={disabled || state.title === '' || state.description === ''}
                    sx={buttonsStyle}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}
