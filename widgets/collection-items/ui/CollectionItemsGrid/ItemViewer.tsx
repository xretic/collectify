'use client';

import { useEffect } from 'react';
import { Dialog, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import type { CollectionItem } from '@/entities/collection/model/types';
import { sourceHost } from '@/entities/collection/ui/ItemCard';
import styles from './ItemViewer.module.css';
import { useTranslations } from 'next-intl';

type ItemViewerProps = {
    items: CollectionItem[];
    index: number;
    onIndexChange: (index: number) => void;
    onClose: () => void;
};

/** Full view of one item with previous / next navigation (also ← → keys). */
export function ItemViewer({ items, index, onIndexChange, onClose }: ItemViewerProps) {
    const t = useTranslations('items');
    const tc = useTranslations('common');
    const item = items[index];
    const hasPrevious = index > 0;
    const hasNext = index < items.length - 1;

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft' && hasPrevious) onIndexChange(index - 1);
            if (event.key === 'ArrowRight' && hasNext) onIndexChange(index + 1);
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [hasNext, hasPrevious, index, onIndexChange]);

    if (!item) return null;

    return (
        <Dialog
            open
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            classes={{ paper: styles.paper }}
            aria-label={item.title || t('item')}
        >
            <div className={`${styles.layout} ${item.imageUrl ? '' : styles.noImage}`}>
                {item.imageUrl && (
                    <div className={styles.media}>
                        <img className={styles.image} src={item.imageUrl} alt={item.title} />
                    </div>
                )}

                <div className={styles.info}>
                    <header className={styles.header}>
                        <span className={styles.position}>
                            {index + 1} / {items.length}
                        </span>
                        <IconButton onClick={onClose} aria-label={tc('close')} color="inherit">
                            <CloseIcon />
                        </IconButton>
                    </header>

                    {item.title && <h2 className={styles.title}>{item.title}</h2>}
                    {item.description && <p className={styles.description}>{item.description}</p>}

                    {item.sourceUrl && (
                        <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className={styles.source}
                        >
                            <LaunchIcon fontSize="small" />
                            {sourceHost(item.sourceUrl)}
                        </a>
                    )}

                    <nav className={styles.nav}>
                        <IconButton
                            onClick={() => onIndexChange(index - 1)}
                            disabled={!hasPrevious}
                            aria-label={t('previous')}
                            color="inherit"
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => onIndexChange(index + 1)}
                            disabled={!hasNext}
                            aria-label={t('next')}
                            color="inherit"
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </nav>
                </div>
            </div>
        </Dialog>
    );
}
