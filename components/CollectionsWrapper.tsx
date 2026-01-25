import CollectionField from './CollectionField';
import { CollectionFieldProps } from '../types/CollectionField';
import { IconButton, Tooltip } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { PAGE_SIZE } from '@/lib/constans';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { usePaginationStore } from '@/stores/paginationStore';

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
            <div className="collections-wrapper">
                {collections.length > 0 ? (
                    collections.map((x) => <CollectionField key={x.id} {...x} />)
                ) : (
                    <div className="nothing-is-here">We found nothing.</div>
                )}
            </div>

            <div className="pagination-wrapper">
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
