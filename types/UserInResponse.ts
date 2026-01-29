export type SessionUserInResponse = {
    id: number;
    avatarUrl: string;
    bannerUrl: string;
    username: string;
    fullName: string;
    description: string;
    followers: number;
    subscriptions: number;
    notifications: number;
};

export type UserInResponse = {
    id: number;
    avatarUrl: string;
    bannerUrl: string;
    username: string;
    fullName: string;
    description: string;
    sessionUserIsFollowed: boolean;
    followers: number;
    subscriptions: number;
};
