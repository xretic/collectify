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
    /** ISO country code. */
    country: string | null;
    city: string | null;
    /** `YYYY-MM-DD`, visible only to the user. */
    birthDate: string | null;
    /** Saved order of the home feed tabs ("for-you", "explore", "board:<id>"). */
    feedTabOrder: string[];
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
    country: string | null;
    city: string | null;
    followers: number;
    subscriptions: number;
    isFollowed: boolean;
    roles: UserRole[];
};

/** A "people you may know" suggestion and why it was made. */
export type SuggestedUser = UserPreview & {
    fullName: string;
    /** People the viewer follows who follow this user. */
    mutual: number;
    /** Set when the user lives in the viewer's city. */
    city: string | null;
    followsYou: boolean;
    /**
     * Whether the viewer follows this user. Always `false` from the server
     * (followed users are never suggested); flips in the cache when the viewer
     * follows them anywhere in the app.
     */
    isFollowed: boolean;
};

export type SuggestionsPage = {
    data: SuggestedUser[];
    hasMore: boolean;
};

export type FollowListKind = 'followers' | 'following';

/** A row in a followers / following list. */
export type FollowListUser = UserPreview & {
    fullName: string;
    /** Whether the viewer follows this user. */
    isFollowed: boolean;
};

export type FollowListPage = {
    data: FollowListUser[];
    /** Keyset cursor (a user id); `null` on the last page. */
    nextCursor: number | null;
};

export const isStaff = (roles: readonly UserRole[]) =>
    roles.includes('Admin') || roles.includes('Moderator');
