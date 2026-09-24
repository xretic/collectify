import { CircularProgress } from '@mui/material';
import styles from './index.module.css';

type SpinnerProps = {
    /** `page` centers in the viewport area, `inline` pads within the flow. */
    variant?: 'inline' | 'page';
    size?: number;
};

export function Spinner({ variant = 'inline', size = 32 }: SpinnerProps) {
    return (
        <div className={styles[variant]} role="status" aria-label="Loading">
            <CircularProgress size={size} />
        </div>
    );
}
