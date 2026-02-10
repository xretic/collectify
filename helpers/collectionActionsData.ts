import { Collection, Session, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export async function collectionActionData(
    session: (Session & { user: User }) | null,
    collection: Collection,
): Promise<{
    liked: boolean;
    favorited: boolean;
}> {
    let liked = false;
    let favorited = false;

    if (session) {
        liked = !!(await prisma.like.findFirst({
            where: {
                userId: session.userId,
                collectionId: collection.id,
            },
        }));

        favorited = !!(await prisma.collection.findFirst({
            where: {
                id: collection.id,
                addedToFavorite: {
                    some: {
                        id: session.userId,
                    },
                },
            },
        }));
    }

    return {
        liked,
        favorited,
    };
}
