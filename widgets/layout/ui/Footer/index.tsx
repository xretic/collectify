import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSelect } from '@/features/locale/ui/LanguageSelect';
import styles from './index.module.css';

export default function Footer() {
    const t = useTranslations('footer');

    return (
        <footer className={styles.footer}>
            <span className={styles.link}>&copy; {new Date().getFullYear()} Collectify</span>
            <Link className={styles.link} href="/privacy-policy">
                {t('privacyPolicy')}
            </Link>
            <LanguageSelect size="small" compact />
        </footer>
    );
}
