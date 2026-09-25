import styles from './index.module.css';
import { useTranslations } from 'next-intl';

/** Telegram-style "typing…" label with animated dots. */
export function TypingIndicator({ className }: { className?: string }) {
    const t = useTranslations('chats');

    return (
        <span className={`${styles.root} ${className ?? ''}`}>
            {t('typing')}
            <span className={styles.dots} aria-hidden="true">
                <span />
                <span />
                <span />
            </span>
        </span>
    );
}
