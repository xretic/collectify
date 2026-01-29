import { NotificationType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

export async function upsertNotification(
    senderUserId: number,
    recipientUserId: number,
    type: NotificationType,
    collectionId?: number,
): Promise<void> {
    const notification = await prisma.notification.findFirst({
        where: { senderUserId, recipientUserId, type },
    });

    if (!notification && !collectionId) {
        await prisma.notification.create({
            data: { senderUserId, recipientUserId, type },
        });
    }

    if (collectionId) {
        await prisma.notification.create({
            data: { senderUserId, recipientUserId, type, collectionId },
        });
    }
}
