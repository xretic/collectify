import { CircularProgress } from '@mui/material';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';

type SpinnerProps = {
    /** `page` centers in the viewport area, `inline` pads within the flow. */
    variant?: 'inline' | 'page';
    size?: number;
};

export function Spinner({ variant = 'inline', size = 32 }: SpinnerProps) {
    const t = useTranslations('common');

    return (
        <div className={styles[variant]} role="status" aria-label={t('loading')}>
            <CircularProgress size={size} />
        </div>
    );
}
