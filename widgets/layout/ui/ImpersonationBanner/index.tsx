import styles from './index.module.css';
import { useTranslations } from 'next-intl';

export function ImpersonationBanner({ username }: { username: string }) {
    const t = useTranslations('nav');

    return (
        <div className={styles.banner} role="status">
            {t.rich('impersonating', {
                username,
                strong: (chunks) => <strong>{chunks}</strong>,
            })}
        </div>
    );
}
