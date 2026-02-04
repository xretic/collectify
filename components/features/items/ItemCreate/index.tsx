'use client';

import { Box, Button, IconButton, Snackbar, SnackbarCloseReason } from '@mui/material';
import styles from '../../../../app/collections/collections.module.css';
import { useCollectionCreateStore } from '@/stores/collectionCreateStore';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { ConfigProvider, Input } from 'antd';
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_TITLE_MAX_LENGTH } from '@/lib/constans';
import TextArea from 'antd/es/input/TextArea';
import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { isValidUrl } from '@/helpers/isValidUrl';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserProvider';

export function ItemCreate() {
    const {
        name,
        itemImage,
        itemTitle,
        itemDescription,
        itemSourceUrl,
        description,
        category,
        banner,
        setField,
        reset,
    } = useCollectionCreateStore();

    const [errorMessage, setErrorMessage] = useState('');
    const { refreshUser } = useUser();
    const router = useRouter();

    const inputStyle: Record<string, string> = {
        backgroundColor: 'var(--container-color)',
        color: 'var(--text-color)',
    };

    const waitForUploadcare = (): Promise<any> =>
        new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = setInterval(() => {
                if ((window as any).uploadcare) {
                    clearInterval(interval);
                    resolve((window as any).uploadcare);
                } else if (++attempts >= 10) {
                    clearInterval(interval);
                    reject(new Error('Uploadcare failed to load.'));
                }
            }, 10);
        });

    const handleUpload = async (setUrl: (url: string) => void) => {
        try {
            const uploadcare = await waitForUploadcare();
            uploadcare
                .openDialog(null, { imagesOnly: true, multiple: false, crop: 'free' })
                .done((file: any) => {
                    file.done((info: any) => setUrl(info.cdnUrl));
                });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (itemSourceUrl && !isValidUrl(itemSourceUrl)) {
            setErrorMessage('Source URL must be either a URL or empty.');
            return;
        }

        const res = await fetch('/api/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description,
                category,
                banner,
                itemTitle,
                itemDescription,
                itemImage: itemImage === '' ? null : itemImage,
                itemSourceUrl: itemSourceUrl === '' ? null : itemSourceUrl,
            }),
        });

        const data = await res.json();

        reset();

        if (!res.ok) {
            setErrorMessage(data.message);
            return;
        }

        router.replace('/collections/' + data.id);
        await refreshUser();
    };

    const handleClose = (_: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
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
        <>
            <Snackbar
                open={errorMessage.length > 0}
                autoHideDuration={3000}
                onClose={handleClose}
                message={errorMessage}
                action={action}
            />

            <header className={styles.createHeader}>
                <p className={styles.createTitle}>Add First Item</p>
                <span className={styles.secondary}>
                    Add the first item to your "{name}" collection
                </span>
            </header>

            <div className={styles.createContainer}>
                <p className={styles.column}>Item Image (optional)</p>
                <Box
                    onClick={() => handleUpload((url) => setField('itemImage', url))}
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
                    {itemImage ? (
                        <div className={styles.bannerWrapper}>
                            <img className={styles.banner} src={itemImage} alt="cover" />
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

                <ConfigProvider
                    theme={{
                        token: {
                            colorTextPlaceholder: 'var(--soft-text)',
                            colorIcon: 'var(--text-color)',
                            colorIconHover: 'var(--text-color)',
                        },
                        components: {
                            Select: {
                                colorBgContainer: 'var(--container-color)',
                                colorText: 'var(--text-color)',
                                colorBorder: 'var(--soft-text)',
                                controlOutline: 'none',
                                optionSelectedBg: 'var(--container-color)',
                                colorBgElevated: 'var(--container-color)',
                                colorTextBase: 'var(--text-color)',
                            },
                        },
                    }}
                >
                    <p className={styles.column}>Source URL (optional)</p>
                    <Input
                        onChange={(x) => setField('itemSourceUrl', x.target.value)}
                        placeholder="Enter source url"
                        defaultValue={itemSourceUrl}
                        style={inputStyle}
                        type="url"
                        required={true}
                    />

                    <p className={styles.column}>Item title</p>
                    <Input
                        onChange={(x) => setField('itemTitle', x.target.value)}
                        placeholder="Enter item title"
                        defaultValue={itemTitle}
                        maxLength={ITEM_TITLE_MAX_LENGTH}
                        style={inputStyle}
                        showCount
                    />

                    <p className={styles.column}>Description</p>
                    <TextArea
                        onChange={(x) => setField('itemDescription', x.target.value)}
                        placeholder="Add a description for your collection"
                        defaultValue={itemDescription}
                        maxLength={ITEM_DESCRIPTION_MAX_LENGTH}
                        style={{ height: 80, resize: 'none', ...inputStyle }}
                        showCount
                    />
                </ConfigProvider>

                <div className={styles.buttons}>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={[itemTitle, itemDescription].some((x) => x === '')}
                        sx={{ borderRadius: 3, height: 35, textTransform: 'none' }}
                    >
                        Create
                    </Button>

                    <Button
                        onClick={() => setField('step', 0)}
                        variant="outlined"
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                            borderColor: 'var(--text-color)',
                        }}
                        sx={{ borderRadius: 3, height: 35, textTransform: 'none' }}
                    >
                        Back
                    </Button>
                </div>
            </div>
        </>
    );
}
