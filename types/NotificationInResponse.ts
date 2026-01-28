import { NotificationType } from '@/generated/prisma/enums';

export type NotificationInResponse = {
    user: {
        id: number | null;
        avatarUrl?: string;
        username?: string;
    };
    notification: {
        type: NotificationType;
        recipientUserId: number;
        senderUserId: number | null;
        isRead: boolean;
        createdAt: Date;
    };
};
