import Link from 'next/link';
import type { TagRef } from '../../model/types';
import styles from './index.module.css';

type TagChipsProps = {
    tags: TagRef[];
    className?: string;
};

/** Tags as links to the feed filtered by that tag. */
export function TagChips({ tags, className }: TagChipsProps) {
    if (tags.length === 0) return null;

    return (
        <ul className={`${styles.tags} ${className ?? ''}`} aria-label="Tags">
            {tags.map((tag) => (
                <li key={tag.id}>
                    <Link href={`/?tag=${tag.id}`} className={styles.tag}>
                        #{tag.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
