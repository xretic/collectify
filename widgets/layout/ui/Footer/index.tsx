import Link from 'next/link';
import styles from './index.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <span className={styles.link}>&copy; {new Date().getFullYear()} Collectify</span>
            <Link className={styles.link} href="/privacy-policy">
                Privacy Policy
            </Link>
        </footer>
    );
}
