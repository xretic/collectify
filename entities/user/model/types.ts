export type UserRole = 'Admin' | 'Moderator' | 'Verified';

export type UserPreview = {
    id: number;
    username: string;
    avatarUrl: string;
};

export type UserRestriction = {
    muted: boolean;
    expiresAt: string | null;
};

/** The signed-in user as returned by `/api/auth/me`. */
export type SessionUser = {
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
    hasPassword: boolean;
    roles: UserRole[];
    impersonatorUserId: number | null;
    restrictions: {
        comments: UserRestriction;
        messenger: UserRestriction;
    };
};

/** Any user's public profile. */
export type PublicUser = {
    id: number;
    avatarUrl: string;
    bannerUrl: string;
    username: string;
    fullName: string;
    description: string;
    followers: number;
    subscriptions: number;
    isFollowed: boolean;
    roles: UserRole[];
};

export const isStaff = (roles: readonly UserRole[]) =>
    roles.includes('Admin') || roles.includes('Moderator');
