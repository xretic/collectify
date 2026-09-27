import Link from 'next/link';
import { useTranslations } from 'next-intl';
import styles from './index.module.css';

type LegalConsentProps = {
    /** `form`: under the email sign-up; `providers`: next to Google / GitHub, which can create accounts. */
    variant: 'form' | 'providers';
};

/** What signing up agrees to, with links to the documents (no pre-ticked boxes, no fine print). */
export function LegalConsent({ variant }: LegalConsentProps) {
    const t = useTranslations('auth.consent');

    return (
        <p className={styles.consent}>
            {t.rich(variant, {
                terms: (chunks) => (
                    <Link href="/terms" target="_blank">
                        {chunks}
                    </Link>
                ),
                privacy: (chunks) => (
                    <Link href="/privacy-policy" target="_blank">
                        {chunks}
                    </Link>
                ),
            })}
        </p>
    );
}
