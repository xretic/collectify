'use client';

import { Box, Button } from '@mui/material';
import styles from '../../../../app/collections/collections.module.css';
import { useCollectionCreateStore } from '@/stores/collectionCreateStore';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { ConfigProvider, Input } from 'antd';
import {
    CATEGORIES,
    COLLECTION_DESCRIPTION_MAX_LENGTH,
    COLLECTION_NAME_MAX_LENGTH,
} from '@/lib/constans';
import TextArea from 'antd/es/input/TextArea';
import { useRouter } from 'next/navigation';
import { handleUpload } from '@/helpers/handleUpload';

export function CollectionCreate() {
    const router = useRouter();

    const { name, description, category, banner, setField } = useCollectionCreateStore();

    const inputStyle: Record<string, string> = {
        backgroundColor: 'var(--container-color)',
        color: 'var(--text-color)',
    };

    return (
        <>
            <header className={styles.createHeader}>
                <p className={styles.createTitle}>Create New Collection</p>
                <span className={styles.secondary}>
                    Add a new collection to organize your content
                </span>
            </header>

            <div className={styles.createContainer}>
                <p className={styles.column}>Cover image</p>

                <Box
                    onClick={() => handleUpload((url) => setField('banner', url))}
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
                    {banner ? (
                        <div className={styles.bannerWrapper}>
                            <img className={styles.banner} src={banner} alt="cover" />
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
                    }}
                >
                    <p className={styles.column}>Collection name</p>
                    <Input
                        onChange={(x) => setField('name', x.target.value)}
                        placeholder="Enter collection name"
                        defaultValue={name}
                        maxLength={COLLECTION_NAME_MAX_LENGTH}
                        style={inputStyle}
                        showCount
                    />

                    <p className={styles.column}>Category</p>
                    <div className={styles.categories}>
                        {CATEGORIES.map((x) => (
                            <Button
                                key={x}
                                onClick={() => setField('category', x)}
                                variant={category === x ? 'contained' : 'outlined'}
                                sx={{ borderRadius: 6, height: 35, textTransform: 'none' }}
                            >
                                {x}
                            </Button>
                        ))}
                    </div>

                    <p className={styles.column}>Description</p>
                    <TextArea
                        onChange={(x) => setField('description', x.target.value)}
                        placeholder="Add a description for your collection"
                        defaultValue={description}
                        maxLength={COLLECTION_DESCRIPTION_MAX_LENGTH}
                        style={{ height: 80, resize: 'none', ...inputStyle }}
                        showCount
                    />
                </ConfigProvider>

                <div className={styles.buttons}>
                    <Button
                        onClick={() => setField('step', 1)}
                        variant="contained"
                        disabled={[name, description, category, banner].some((x) => x === '')}
                        sx={{ borderRadius: 3, height: 35, textTransform: 'none' }}
                    >
                        Continue
                    </Button>

                    <Button
                        onClick={() => router.replace('/')}
                        variant="outlined"
                        style={{
                            backgroundColor: 'var(--container-color)',
                            color: 'var(--text-color)',
                            borderColor: 'var(--text-color)',
                        }}
                        sx={{ borderRadius: 3, height: 35, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    );
}
