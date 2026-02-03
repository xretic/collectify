import Link from 'next/link';
import styles from './ItemCard.module.css';
import LaunchIcon from '@mui/icons-material/Launch';

interface Props {
    title: string;
    description: string;
    imageUrl: string | null;
    sourceUrl: string | null;
}

export function ItemCard({ title, description, imageUrl, sourceUrl }: Props) {
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

                    {sourceUrl && (
                        <Link
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                            aria-label="Open source"
                        >
                            <LaunchIcon className={styles.sourceIcon} />
                        </Link>
                    )}
                </div>

                <p className={styles.description}>{description}</p>
            </div>
        </article>
    );
}
