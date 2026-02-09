import { IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import styles from './index.module.css';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useCollectionStore } from '@/stores/collectionStore';
import { useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '@/lib/api';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';

interface Item {
    id: number;
    title: string;
    description: string;
    sourceUrl: string | null;
}

interface Props {
    item: Item;
    collection: CollectionPropsAdditional;
}

export function ItemField({ item, collection }: Props) {
    const { setCollection } = useCollectionStore();
    const { startLoading, stopLoading, loadingCount, itemDeletionId, setItemDeletionId } =
        useUIStore();
    const buttonsStyle: SxProps<Theme> = { color: 'var(--text-color)' };
    const queryClient = useQueryClient();

    const deleteItem = async () => {
        startLoading();

        try {
            const data = await api
                .delete(`api/collections/${collection.id}/items`, {
                    searchParams: {
                        itemId: item.id,
                    },
                })
                .json<{ data: CollectionPropsAdditional }>();

            setCollection(data.data);

            queryClient.removeQueries({
                predicate: (query) =>
                    query.queryKey.includes('collection') ||
                    query.queryKey.includes('collections-search'),
            });

            setItemDeletionId(0);
        } catch {
            return;
        } finally {
            stopLoading();
        }
    };

    const openAccepting = () => {
        setItemDeletionId(item.id);
    };

    return (
        <div className={styles.box}>
            <div className={styles.text}>
                <span className={styles.title}>{item.title}</span>
                <p className={styles.description}>{item.description}</p>
            </div>

            {itemDeletionId === item.id ? (
                <>
                    <Tooltip title="Delete item">
                        <IconButton
                            disabled={loadingCount > 0}
                            onClick={deleteItem}
                            sx={buttonsStyle}
                        >
                            <CheckIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Cancel">
                        <IconButton
                            disabled={loadingCount > 0}
                            onClick={() => setItemDeletionId(0)}
                            sx={buttonsStyle}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </>
            ) : (
                <Tooltip title="Delete item">
                    <IconButton disabled={loadingCount > 0} onClick={openAccepting} color="error">
                        <DeleteOutlineOutlinedIcon />
                    </IconButton>
                </Tooltip>
            )}
        </div>
    );
}
