import { Collection } from '@/generated/prisma/client';
import { CollectionPropsAdditional } from '@/types/CollectionField';

export function getResData(
    collection: Collection & {
        likes: {
            id: number;
            userId: number;
            collectionId: number;
        }[];
        addedToFavorite: {
            id: number;
            description: string;
            bannerUrl: string;
            email: string;
            passwordHash: string | null;
            avatarUrl: string;
            username: string;
            fullName: string;
        }[];
        items: {
            id: number;
            description: string;
            collectionId: number | null;
            title: string;
            sourceUrl: string | null;
        }[];
        User: {
            id: number;
            description: string;
            bannerUrl: string;
            email: string;
            passwordHash: string | null;
            avatarUrl: string;
            username: string;
            fullName: string;
        } | null;
    },
): CollectionPropsAdditional | null {
    if (!collection.User) return null;

    return {
        id: collection.id,
        author: collection.User.fullName,
        authorAvatarUrl: collection.User.avatarUrl,
        description: collection.description,
        authorId: collection.User.id,
        bannerUrl: collection.bannerUrl,
        name: collection.name,
        category: collection.category,
        likes: collection.likes.map((x) => ({
            id: x.userId,
        })),

        addedToFavorite: collection.addedToFavorite.map((x) => ({
            id: x.id,
        })),

        items: collection.items.map((x) => ({
            id: x.id,
            title: x.title,
            description: x.description,
            sourceUrl: x.sourceUrl,
        })),
    };
}
