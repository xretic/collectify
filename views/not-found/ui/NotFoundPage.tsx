'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import { ArrowBack, Home, SearchOff } from '@mui/icons-material';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
    const router = useRouter();

    return (
        <section className={styles.page}>
            <div className={styles.content}>
                <SearchOff className={styles.icon} />
                <span className={styles.code}>404</span>

                <div className={styles.text}>
                    <h1 className={styles.title}>Page Not Found</h1>
                    <p className={styles.description}>
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Home />}
                        component={Link}
                        href="/"
                    >
                        Go Home
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<ArrowBack />}
                        onClick={() => router.back()}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </section>
    );
}
