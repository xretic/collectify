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
};

export type CollectionPropsAdditional = {
    id: number;
    author: string;
    authorAvatarUrl: string;
    authorId: number;
    bannerUrl: string;
    name: string;
    category: string;
    likes: {
        id: number;
        username: string;
        avatarUrl: string;
    }[];
    addedToFavorite: {
        id: number;
        username: string;
        avatarUrl: string;
    }[];
    items: {
        title: string;
        description: string;
        tags: string[];
    }[];
};
