import { api } from '@/shared/api/api';
import type { PublicUser, SessionUser, UserPreview } from '@/entities/user/model/types';

type UserResponse = { user: SessionUser };

export type UpdateProfilePayload = Partial<{
    username: string;
    fullName: string;
    description: string;
    avatarUrl: string;
    bannerUrl: string;
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

    async follow(userId: number) {
        await api.put(`users/${userId}/follow`);
    },

    async unfollow(userId: number) {
        await api.delete(`users/${userId}/follow`);
    },
};
