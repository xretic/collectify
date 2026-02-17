import { CollectionFieldProps } from '@/types/CollectionField';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import { Avatar } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './index.module.css';
import ForumIcon from '@mui/icons-material/Forum';

export default function CollectionField({
                                            id,
                                            author,
                                            authorAvatarUrl,
                                            authorId,
                                            bannerUrl,
                                            name,
                                            category,
                                            likes,
                                            addedToFavorite,
                                            items,
                                            comments,
                                        }: CollectionFieldProps) {
    const router = useRouter();

    return (
        <Link href={'/collections/' + id} className={styles.card}>
            <div className={styles.banner}>
                <span className={styles.category}>{category}</span>
                <img src={bannerUrl} alt={name} className={styles['banner-img']} />
            </div>

            <div className={styles.content}>
                <h2 className={styles.title}>{name}</h2>

                <div className={styles.author}>
                    <Avatar src={authorAvatarUrl} alt={author} sx={{ width: 24, height: 24 }} />
                    <span
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.replace('/users/' + authorId);
                        }}
                        className={styles['author-name']}
                    >
                        {author}
                    </span>
                </div>

                <div className={styles.border} />

                <div className={styles.footer}>
                    <span className={styles.items}>
                        <FolderCopyIcon sx={{ width: 20, height: 20 }} />
                        {items} items
                    </span>

                    <div className={styles.stats}>
                            <span>
                            <ForumIcon sx={{ width: 20, height: 20 }} /> {comments}
                        </span>
                        <span>
                            <BookmarkAddIcon sx={{ width: 20, height: 20 }} /> {addedToFavorite}
                        </span>
                        <span>
                            <FavoriteIcon sx={{ width: 20, height: 20 }} /> {likes}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
