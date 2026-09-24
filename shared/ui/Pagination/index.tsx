import { IconButton, Tooltip } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import styles from './index.module.css';

type PaginationProps = {
    /** Zero-based page. */
    page: number;
    hasMore: boolean;
    onChange: (page: number) => void;
};

export function Pagination({ page, hasMore, onChange }: PaginationProps) {
    if (page === 0 && !hasMore) return null;

    return (
        <nav className={styles.pagination} aria-label="Pagination">
            <Tooltip title="Previous page">
                <span>
                    <IconButton
                        disabled={page === 0}
                        onClick={() => onChange(page - 1)}
                        aria-label="Previous page"
                    >
                        <KeyboardArrowLeftIcon />
                    </IconButton>
                </span>
            </Tooltip>

            <span>Page {page + 1}</span>

            <Tooltip title="Next page">
                <span>
                    <IconButton
                        disabled={!hasMore}
                        onClick={() => onChange(page + 1)}
                        aria-label="Next page"
                    >
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </nav>
    );
}
