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
    description: string;
    authorId: number;
    bannerUrl: string;
    name: string;
    category: string;
    likes: {
        id: number;
    }[];
    addedToFavorite: {
        id: number;
    }[];
    items: {
        title: string;
        description: string;
        sourceUrl: string | null;
        imageUrl: string | null;
    }[];
};
