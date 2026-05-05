import { IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import styles from './index.module.css';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useCollectionStore } from '@/entities/collection/model/collectionStore';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { CollectionPropsAdditional } from '@/types/CollectionField';
import { useUIStore } from '@/shared/model/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import { collectionApi } from '@/entities/collection/api/collectionApi';
import { collectionQueryKeys } from '@/entities/collection/model/queryKeys';
import { CollectionItem } from '@/entities/collection/model/types';
import { useItemEditDialogStore } from '@/features/item/edit/model/itemEditDialogStore';

interface Props {
    item: CollectionItem;
    collection: CollectionPropsAdditional;
    isLast: boolean;
}

export function ItemField({ item, collection, isLast }: Props) {
    const { setCollection } = useCollectionStore();
    const { startLoading, stopLoading, loadingCount, itemDeletionId, setItemDeletionId } =
        useUIStore();
    const buttonsStyle: SxProps<Theme> = { color: 'var(--text-color)' };
    const queryClient = useQueryClient();
    const { openItemEdit } = useItemEditDialogStore();

    const deleteItem = async () => {
        startLoading();

        try {
            const updatedCollection = await collectionApi.deleteItem(collection.id, item.id);

            setCollection(updatedCollection);
            queryClient.setQueryData(collectionQueryKeys.detail(collection.id), updatedCollection);

            queryClient.invalidateQueries({
                predicate: (query) =>
                    query.queryKey.includes(collectionQueryKeys.search[0]) ||
                    query.queryKey.includes(collectionQueryKeys.mySearch[0]),
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
                <>
                    {!isLast && (
                        <Tooltip title="Delete item">
                            <IconButton
                                disabled={loadingCount > 0}
                                onClick={openAccepting}
                                color="error"
                            >
                                <DeleteOutlineOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Edit item">
                        <IconButton
                            disabled={loadingCount > 0}
                            onClick={() => openItemEdit(item)}
                            color="inherit"
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </>
            )}
        </div>
    );
}
