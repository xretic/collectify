import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LaunchIcon from '@mui/icons-material/Launch';
import type { CollectionItem } from '../../model/types';
import styles from './index.module.css';

type ItemCardProps = {
    item: CollectionItem;
    /** Opens the item viewer. */
    onOpen?: () => void;
    /** Listeners from dnd-kit when the item can be dragged. */
    dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
    /** Owner controls (edit / delete), shown over the card. */
    actions?: ReactNode;
};

export function sourceHost(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return url;
    }
}

const stop = (event: { stopPropagation: () => void }) => event.stopPropagation();

/**
 * A tile of the items grid. Image items fill the tile with the text on a
 * shaded strip at the bottom; items without an image are plain text cards.
 */
export function ItemCard({ item, onOpen, dragHandleProps, actions }: ItemCardProps) {
    const onKeyDown = (event: KeyboardEvent) => {
        if (onOpen && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onOpen();
        }
    };

    const hasText = item.title !== '' || item.description !== '';

    return (
        <article
            className={`${styles.card} ${styles[`size${item.size}`]} ${item.imageUrl ? styles.withImage : styles.textOnly}`}
            onClick={onOpen}
            onKeyDown={onKeyDown}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
            aria-label={item.title || 'Open item'}
        >
            {item.imageUrl && (
                <img className={styles.image} src={item.imageUrl} alt={item.title} loading="lazy" />
            )}

            {(hasText || item.sourceUrl) && (
                <div className={styles.body}>
                    {item.title && <h3 className={styles.title}>{item.title}</h3>}
                    {item.description && <p className={styles.description}>{item.description}</p>}

                    {item.sourceUrl && (
                        <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className={styles.source}
                            onClick={stop}
                            onPointerDown={stop}
                        >
                            <LaunchIcon className={styles.sourceIcon} />
                            <span>{sourceHost(item.sourceUrl)}</span>
                        </a>
                    )}
                </div>
            )}

            {(actions || dragHandleProps) && (
                <div className={styles.controls} onClick={stop} onKeyDown={stop}>
                    {dragHandleProps && (
                        <button
                            type="button"
                            className={styles.control}
                            aria-label="Drag item"
                            {...dragHandleProps}
                        >
                            <DragIndicatorIcon fontSize="small" />
                        </button>
                    )}
                    {actions && <span className={styles.control}>{actions}</span>}
                </div>
            )}
        </article>
    );
}
