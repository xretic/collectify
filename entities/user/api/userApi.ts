import { api } from '@/shared/api/api';
import type {
    FollowListKind,
    FollowListPage,
    PublicUser,
    SessionUser,
    SuggestionsPage,
    TopCreator,
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

    suggestions(skip: number, take: number) {
        return api
            .get('users/suggestions', { searchParams: { skip, take } })
            .json<SuggestionsPage>();
    },

    /** The account's data export as a file (POST: must not be triggerable by a link). */
    async exportData() {
        const res = await api.post('users/me/export');
        const disposition = res.headers.get('Content-Disposition') ?? '';
        const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'collectify-data.json';
        return { blob: await res.blob(), filename };
    },

    async setFeedTabOrder(order: string[]) {
        await api.put('users/me/feed-tabs', { json: { order } });
    },

    /** Popular authors in these categories, for new accounts to follow. */
    async creators(categoryIds: number[]) {
        const searchParams = categoryIds.length ? { categories: categoryIds.join(',') } : {};
        return (
            await api.get('users/creators', { searchParams }).json<{ creators: TopCreator[] }>()
        ).creators;
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
