import { IconButton, Tooltip } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type PaginationProps = {
    /** Zero-based page. */
    page: number;
    hasMore: boolean;
    onChange: (page: number) => void;
};

export function Pagination({ page, hasMore, onChange }: PaginationProps) {
    const t = useTranslations('pagination');

    if (page === 0 && !hasMore) return null;

    return (
        <nav className={styles.pagination} aria-label={t('label')}>
            <Tooltip title={t('previous')}>
                <span>
                    <IconButton
                        disabled={page === 0}
                        onClick={() => onChange(page - 1)}
                        aria-label={t('previous')}
                    >
                        <KeyboardArrowLeftIcon />
                    </IconButton>
                </span>
            </Tooltip>

            <span>{t('page', { page: page + 1 })}</span>

            <Tooltip title={t('next')}>
                <span>
                    <IconButton
                        disabled={!hasMore}
                        onClick={() => onChange(page + 1)}
                        aria-label={t('next')}
                    >
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </nav>
    );
}
