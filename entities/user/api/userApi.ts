import { api } from '@/shared/api/api';
import type {
    FollowListKind,
    FollowListPage,
    PublicUser,
    SessionUser,
    SuggestionsPage,
    UserPreview,
} from '@/entities/user/model/types';

type UserResponse = { user: SessionUser };

export type UpdateProfilePayload = Partial<{
    username: string;
    fullName: string;
    description: string;
    avatarUrl: string;
    bannerUrl: string;
    country: string | null;
    city: string | null;
    birthDate: string | null;
}>;

export const userApi = {
    async getById(userId: number | string) {
        return (await api.get(`users/${userId}`).json<{ user: PublicUser }>()).user;
    },

    async search(query: string) {
        return (
            await api
                .get('users/search', { searchParams: { q: query } })
                .json<{ users: UserPreview[] }>()
        ).users;
    },

    suggestions(skip: number, take: number) {
        return api
            .get('users/suggestions', { searchParams: { skip, take } })
            .json<SuggestionsPage>();
    },

    async setFeedTabOrder(order: string[]) {
        await api.put('users/me/feed-tabs', { json: { order } });
    },

    async interests() {
        return (await api.get('users/me/interests').json<{ categoryIds: number[] }>()).categoryIds;
    },

    async setInterests(categoryIds: number[]) {
        return (
            await api
                .put('users/me/interests', { json: { categoryIds } })
                .json<{ categoryIds: number[] }>()
        ).categoryIds;
    },

    async updateProfile(payload: UpdateProfilePayload) {
        return (await api.patch('users/me', { json: payload }).json<UserResponse>()).user;
    },

    async changePassword(payload: {
        currentPassword?: string;
        newPassword: string;
        confirmPassword: string;
    }) {
        return (await api.patch('users/me/password', { json: payload }).json<UserResponse>()).user;
    },

    async deleteAccount(confirmation: string) {
        await api.delete('users/me', { json: { confirmation } });
    },

    follows(userId: number, kind: FollowListKind, cursor: number | null) {
        return api
            .get(`users/${userId}/${kind}`, { searchParams: cursor ? { cursor } : {} })
            .json<FollowListPage>();
    },

    async follow(userId: number) {
        await api.put(`users/${userId}/follow`);
    },

    async unfollow(userId: number) {
        await api.delete(`users/${userId}/follow`);
    },
};
