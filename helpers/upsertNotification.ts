import { NotificationType } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

export async function upsertNotification(
    senderUserId: number,
    recipientUserId: number,
    type: NotificationType,
): Promise<void> {
    const notification = await prisma.notification.findFirst({
        where: { senderUserId, recipientUserId, type },
    });

    if (!notification) {
        await prisma.notification.create({
            data: { senderUserId, recipientUserId, type },
        });
    }
}
