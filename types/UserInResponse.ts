import { UserRole } from './UserRole';

export type UserRestrictionInResponse = {
    muted: boolean;
    expiresAt: string | null;
};

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
    unreadMessages: number;
    protected: boolean;
    roles: UserRole[];
    admin: boolean;
    impersonatorUserId: number | null;
    restrictions: {
        comments: UserRestrictionInResponse;
        messenger: UserRestrictionInResponse;
    };
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
    roles: UserRole[];
};
