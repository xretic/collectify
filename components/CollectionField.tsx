import { CollectionFieldProps } from '@/types/CollectionField';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import { Avatar } from '@mui/material';
import Link from 'next/link';

export default function CollectionField({
    author,
    authorAvatarUrl,
    authorId,
    bannerUrl,
    name,
    category,
    likes,
    addedToFavorite,
    items,
}: CollectionFieldProps) {
    return (
        <div className="collection-card">
            <div className="collection-banner">
                <img src={bannerUrl} alt={name} className="collection-banner-img" />
            </div>

            <div className="collection-content">
                <h2 className="collection-title">{name}</h2>

                <Link href={'/users/' + authorId} className="collection-author">
                    <Avatar src={authorAvatarUrl} alt={author} sx={{ width: 24, height: 24 }} />
                    <span className="collection-author-name">{author}</span>
                </Link>

                {category && <span className="collection-category">{category}</span>}

                <div className="collection-footer">
                    <span className="collection-items">
                        <FolderCopyIcon sx={{ width: 20, height: 20 }} />
                        {items} items
                    </span>

                    <div className="collection-stats">
                        <span>
                            <BookmarkAddIcon sx={{ width: 20, height: 20 }} /> {addedToFavorite}
                        </span>
                        <span>
                            <FavoriteIcon sx={{ width: 20, height: 20 }} /> {likes}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
