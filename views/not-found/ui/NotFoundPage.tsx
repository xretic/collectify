'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import { ArrowBack, Home, SearchOff } from '@mui/icons-material';
import styles from './NotFoundPage.module.css';
import { useTranslations } from 'next-intl';

export default function NotFoundPage() {
    const t = useTranslations('notFound');
    const router = useRouter();

    return (
        <section className={styles.page}>
            <div className={styles.content}>
                <SearchOff className={styles.icon} />
                <span className={styles.code}>404</span>

                <div className={styles.text}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.description}>{t('description')}</p>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Home />}
                        component={Link}
                        href="/"
                    >
                        {t('home')}
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<ArrowBack />}
                        onClick={() => router.back()}
                    >
                        {t('back')}
                    </Button>
                </div>
            </div>
        </section>
    );
}
