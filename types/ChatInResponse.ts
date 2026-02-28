export type ChatInResponse = {
    id: number;
    userId: number;
    userAvatarUrl: string;
    username: string;
    previewContent?: string;
    createdAt: Date;
    unread: number;
    messages?: MessageInResponse[];
};

export type MessageInResponse = {
    id: number;
    userId: number;
    userAvatarUrl: string;
    username: string;
    content: string;
    createdAt: Date;
};
