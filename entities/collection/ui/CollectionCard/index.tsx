import Link from 'next/link';
import { Avatar } from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import ForumIcon from '@mui/icons-material/Forum';
import type { CollectionCard as CollectionCardData } from '../../model/types';
import { formatCompact } from '@/shared/lib/format/number';
import styles from './index.module.css';

export function CollectionCard({ collection }: { collection: CollectionCardData }) {
    const { id, name, bannerUrl, category, isPrivate, author } = collection;

    return (
        <article className={styles.card}>
            {/* Stretched link: the whole card opens the collection, the author link stays separate. */}
            <Link href={`/collections/${id}`} className={styles.cover} aria-label={name} />

            <div className={styles.banner}>
                <span className={styles.category}>{category}</span>
                <img src={bannerUrl} alt="" className={styles.bannerImage} loading="lazy" />
            </div>

            <div className={styles.content}>
                <h2 className={styles.title} title={name}>
                    {name}
                </h2>

                {author && (
                    <Link href={`/users/${author.id}`} className={styles.author}>
                        <Avatar
                            src={author.avatarUrl}
                            alt={author.fullName}
                            className={styles.avatar}
                        />
                        <span className={styles.authorName}>{author.fullName}</span>
                    </Link>
                )}

                <div className={styles.footer}>
                    <span className={styles.stat} title={`${collection.items} items`}>
                        <FolderCopyIcon className={styles.icon} />
                        {formatCompact(collection.items)}
                    </span>

                    {!isPrivate && (
                        <span className={styles.stats}>
                            <span className={styles.stat} title={`${collection.comments} comments`}>
                                <ForumIcon className={styles.icon} />
                                {formatCompact(collection.comments)}
                            </span>
                            <span
                                className={styles.stat}
                                title={`${collection.favorites} favorites`}
                            >
                                <BookmarkAddIcon className={styles.icon} />
                                {formatCompact(collection.favorites)}
                            </span>
                            <span className={styles.stat} title={`${collection.likes} likes`}>
                                <FavoriteIcon className={styles.icon} />
                                {formatCompact(collection.likes)}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
