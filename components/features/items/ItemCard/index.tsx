import Link from 'next/link';
import styles from './index.module.css';
import LaunchIcon from '@mui/icons-material/Launch';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface Props {
    title: string;
    description: string;
    sourceUrl: string | null;
    imageUrl: string | null;
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
    draggable?: boolean;
}

export function ItemCard({
    title,
    description,
    sourceUrl,
    imageUrl,
    dragHandleProps,
    draggable = false,
}: Props) {
    const color = imageUrl ? 'white' : 'var(--text-color)';

    return (
        <article
            className={styles.card}
            style={imageUrl ? { ['--bg-image' as any]: `url(${imageUrl})` } : undefined}
        >
            <div
                className={styles.body}
                style={
                    imageUrl
                        ? {
                              background: `linear-gradient(
    to top,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.1) 30%,
    rgba(0, 0, 0, 0) 100%
)`,
                          }
                        : {}
                }
            >
                <div className={styles.header}>
                    <h3 className={styles.title} style={{ color: color }}>
                        {title}
                    </h3>
                    <div className={styles.headerActions}>
                        {draggable && (
                            <button
                                type="button"
                                className={styles.dragHandle}
                                aria-label="Drag item"
                                {...dragHandleProps}
                                style={{ color: color }}
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
                                style={{ color: color }}
                                aria-label="Open source"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <LaunchIcon className={styles.sourceIcon} />
                            </Link>
                        )}
                    </div>
                </div>

                <p className={styles.description} style={{ color: color }}>
                    {description}
                </p>
            </div>
        </article>
    );
}
