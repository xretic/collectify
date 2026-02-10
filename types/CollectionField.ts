export type CollectionFieldProps = {
    id: number;
    author: string;
    authorAvatarUrl: string;
    authorId: number;
    bannerUrl: string;
    name: string;
    category: string;
    likes: number;
    addedToFavorite: number;
    items: number;
    comments: number;
};

export type CollectionPropsAdditional = {
    id: number;
    author: string;
    authorAvatarUrl: string;
    description: string;
    authorId: number;
    bannerUrl: string;
    name: string;
    category: string;
    liked: boolean;
    favorited: boolean;
    items: {
        id: number;
        title: string;
        description: string;
        sourceUrl: string | null;
        imageUrl: string | null;
    }[];
    comments: number;
    commentsRes: {
        id: number;
        userId: number;
        username: string;
        avatarUrl: string;
        createdAt: Date;
        text: string;
    }[];
};
