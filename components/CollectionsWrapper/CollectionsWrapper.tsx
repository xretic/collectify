import CollectionField from '../CollectionField/CollectionField';
import { CollectionFieldProps } from '../../types/CollectionField';
import { IconButton, Tooltip } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { PAGE_SIZE } from '@/lib/constans';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { usePaginationStore } from '@/stores/paginationStore';
import styles from './CollectionsWrapper.module.css';

type CollectionsWrapperProps = {
    collections: CollectionFieldProps[];
    page: 'home' | 'profile';
};

export default function CollectionsWrapper({ collections, page }: CollectionsWrapperProps) {
    const { homePagination, setHomePagination, profilePagination, setProfilePagination } =
        usePaginationStore();

    const pagination = page === 'home' ? homePagination : profilePagination;
    const setPagination = page === 'home' ? setHomePagination : setProfilePagination;

    return (
        <>
            <div className={styles.collections}>
                {collections.length > 0 ? (
                    collections.map((x) => <CollectionField key={x.id} {...x} />)
                ) : (
                    <div className={styles.nothing}>We found nothing.</div>
                )}
            </div>

            <div className={styles.pagination}>
                <Tooltip title="Previous page">
                    <IconButton
                        disabled={pagination === 0}
                        type="button"
                        onClick={() => setPagination(pagination - 1)}
                        sx={{ p: '10px' }}
                        aria-label="search"
                    >
                        <KeyboardArrowLeftIcon sx={{ color: '#afafaf' }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Next page">
                    <IconButton
                        onClick={() => setPagination(pagination + 1)}
                        type="button"
                        disabled={collections.length === 0 || collections.length < PAGE_SIZE}
                        sx={{ p: '10px' }}
                        aria-label="search"
                    >
                        <KeyboardArrowRightIcon sx={{ color: '#afafaf' }} />
                    </IconButton>
                </Tooltip>
            </div>
        </>
    );
}
