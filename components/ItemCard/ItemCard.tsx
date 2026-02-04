import Link from 'next/link';
import styles from './ItemCard.module.css';
import LaunchIcon from '@mui/icons-material/Launch';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface Props {
    title: string;
    description: string;
    imageUrl: string | null;
    sourceUrl: string | null;
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
    draggable?: boolean;
}

export function ItemCard({
    title,
    description,
    imageUrl,
    sourceUrl,
    dragHandleProps,
    draggable = false,
}: Props) {
    return (
        <article className={styles.card}>
            {imageUrl && (
                <div className={styles.imageWrap}>
                    <img src={imageUrl} alt={title} className={styles.image} />
                </div>
            )}

            <div className={styles.body}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>

                    <div className={styles.headerActions}>
                        {draggable && (
                            <button
                                type="button"
                                className={styles.dragHandle}
                                aria-label="Drag item"
                                {...dragHandleProps}
                                onClick={(e) => e.preventDefault()}
                            >
                                <DragIndicatorIcon fontSize="small" />
                            </button>
                        )}

                        {sourceUrl && (
                            <Link
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.sourceLink}
                                aria-label="Open source"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <LaunchIcon className={styles.sourceIcon} />
                            </Link>
                        )}
                    </div>
                </div>

                <p className={styles.description}>{description}</p>
            </div>
        </article>
    );
}
