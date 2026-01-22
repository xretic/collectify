interface CollectionFieldProps {
    author: string;
    authorAvatarUrl: string;
    bannerUrl: string;
    name: string;
    category: string;
    likes: number;
    addedToFavorite: number[];
    items: number;
}

export default function CollectionField({
    author,
    authorAvatarUrl,
    bannerUrl,
    name,
    category,
    likes,
    addedToFavorite,
    items,
}: CollectionFieldProps) {
    return <div></div>;
}
