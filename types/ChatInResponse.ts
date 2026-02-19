export type ChatInResponse = {
    id: number;
    userId: number;
    userAvatarUrl: string;
    username: string;
    previewContent?: string;
    createdAt: Date;
    messages?: MessageInResponse[];
};

interface MessageInResponse {
    id: number;
    userId: number;
    content: string;
    createdAt: Date;
}
