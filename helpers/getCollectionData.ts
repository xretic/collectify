import { Collection } from '@/generated/prisma/client';
import { CollectionPropsAdditional } from '@/types/CollectionField';

export function getResData(
    collection: Collection & {
        liked: boolean;
        favorited: boolean;
        items: {
            id: number;
            description: string;
            collectionId: number | null;
            title: string;
            sourceUrl: string | null;
            imageUrl: string | null;
        }[];

        comments: number;
        commentsRes: {
            id: number;
            userId: number;
            collectionId: number;
            text: string;
            createdAt: Date;
            User: {
                id: number;
                createdAt: Date;
                description: string;
                bannerUrl: string;
                email: string;
                passwordHash: string | null;
                avatarUrl: string;
                username: string;
                fullName: string;
                githubId: string | null;
                googleId: string | null;
            } | null;
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
        liked: collection.liked,
        favorited: collection.favorited,
        items: collection.items.map((x) => ({
            id: x.id,
            title: x.title,
            description: x.description,
            sourceUrl: x.sourceUrl,
            imageUrl: x.imageUrl,
        })),

        comments: collection.comments,
        commentsRes: collection.commentsRes.map((x) => ({
            id: x.id,
            userId: x.userId,
            avatarUrl: x.User!.avatarUrl,
            username: x.User!.username,
            createdAt: x.createdAt,
            text: x.text,
        })),
    };
}
