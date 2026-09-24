import type { HTMLAttributes, ReactNode } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LaunchIcon from '@mui/icons-material/Launch';
import type { CollectionItem } from '../../model/types';
import styles from './index.module.css';

type ItemCardProps = {
    item: CollectionItem;
    /** Listeners from dnd-kit when the item can be dragged. */
    dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
    /** Owner controls (edit / delete). */
    actions?: ReactNode;
};

export function ItemCard({ item, dragHandleProps, actions }: ItemCardProps) {
    const hasImage = Boolean(item.imageUrl);

    return (
        <article className={`${styles.card} ${hasImage ? styles.withImage : ''}`}>
            {item.imageUrl && (
                <img className={styles.image} src={item.imageUrl} alt="" loading="lazy" />
            )}

            <div className={styles.body}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{item.title}</h3>

                    <div className={styles.headerActions}>
                        {actions}

                        {dragHandleProps && (
                            <button
                                type="button"
                                className={styles.dragHandle}
                                aria-label="Drag item"
                                {...dragHandleProps}
                            >
                                <DragIndicatorIcon fontSize="small" />
                            </button>
                        )}

                        {item.sourceUrl && (
                            <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className={styles.sourceLink}
                                aria-label="Open source"
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                <LaunchIcon fontSize="small" />
                            </a>
                        )}
                    </div>
                </div>

                <p className={styles.description}>{item.description}</p>
            </div>
        </article>
    );
}
