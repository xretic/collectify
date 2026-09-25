'use client';

import Link from 'next/link';
import { Avatar } from '@mui/material';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import ForumIcon from '@mui/icons-material/Forum';
import type { CollectionCard as CollectionCardData } from '../../model/types';
import styles from './index.module.css';
import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/lib/format/useFormatters';
import { useCategoryName } from '@/entities/category/model/useCategoryName';

export function CollectionCard({ collection }: { collection: CollectionCardData }) {
    const t = useTranslations('collectionCard');
    const format = useFormatters();
    const categoryName = useCategoryName();
    const { id, name, bannerUrl, category, isPrivate, author } = collection;

    return (
        <article className={styles.card}>
            {/* Stretched link: the whole card opens the collection, the author link stays separate. */}
            <Link href={`/collections/${id}`} className={styles.cover} aria-label={name} />

            <div className={styles.banner}>
                <span className={styles.category}>{categoryName(category)}</span>
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
                    <span className={styles.stat} title={t('items', { count: collection.items })}>
                        <FolderCopyIcon className={styles.icon} />
                        {format.compact(collection.items)}
                    </span>

                    {!isPrivate && (
                        <span className={styles.stats}>
                            <span
                                className={styles.stat}
                                title={t('comments', { count: collection.comments })}
                            >
                                <ForumIcon className={styles.icon} />
                                {format.compact(collection.comments)}
                            </span>
                            <span
                                className={styles.stat}
                                title={t('favorites', { count: collection.favorites })}
                            >
                                <BookmarkAddIcon className={styles.icon} />
                                {format.compact(collection.favorites)}
                            </span>
                            <span
                                className={styles.stat}
                                title={t('likes', { count: collection.likes })}
                            >
                                <FavoriteIcon className={styles.icon} />
                                {format.compact(collection.likes)}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
