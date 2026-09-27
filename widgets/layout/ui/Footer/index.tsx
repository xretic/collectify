import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LanguageSelect } from '@/features/locale/ui/LanguageSelect';
import { CookieSettingsButton } from '@/features/consent/ui/CookieSettingsButton';
import styles from './index.module.css';

const LINKS = [
    { href: '/terms', key: 'terms' },
    { href: '/privacy-policy', key: 'privacyPolicy' },
    { href: '/cookies', key: 'cookies' },
    { href: '/legal', key: 'legalNotice' },
] as const;

export default function Footer() {
    const t = useTranslations('footer');

    return (
        <footer className={styles.footer}>
            <span className={styles.link}>&copy; {new Date().getFullYear()} Collectify</span>
            <nav className={styles.links} aria-label={t('legal')}>
                {LINKS.map((link) => (
                    <Link key={link.href} className={styles.link} href={link.href}>
                        {t(link.key)}
                    </Link>
                ))}
                <CookieSettingsButton />
            </nav>
            <LanguageSelect size="small" compact />
        </footer>
    );
}
