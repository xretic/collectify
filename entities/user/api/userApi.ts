import { api } from '@/shared/api/api';
import { SessionUserInResponse, UserInResponse } from '@/types/UserInResponse';

export type UserSearchItem = {
    id: number;
    username: string;
    avatarUrl: string;
};

type UpdateUserProfilePayload = {
    fullName: string;
    username: string;
    description: string;
    bannerUrl?: string;
    avatarUrl?: string;
};

type UpdatePasswordPayload = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export const userApi = {
    async getById(userId: string | number) {
        const data = await api.get(`api/users/${userId}`).json<{ user: UserInResponse }>();
        return data.user;
    },

    async search(query: string) {
        const data = await api.get(`api/users/search/${query}`).json<{ users: UserSearchItem[] }>();
        return data.users;
    },

    updateProfile(payload: UpdateUserProfilePayload) {
        return api
            .patch('api/users/', {
                json: payload,
            })
            .json<{ user: SessionUserInResponse }>();
    },

    updatePassword(payload: UpdatePasswordPayload) {
        return api
            .patch('api/users/auth', {
                json: payload,
            })
            .json<{ user: SessionUserInResponse }>();
    },

    updateFollow(userId: number, action: 'follow' | 'unfollow') {
        return api.patch('api/users', {
            searchParams: {
                followUserId: userId,
                followAction: action,
            },
        });
    },

    deleteAccount(password: string) {
        return api.delete('api/users/', {
            json: { password },
        });
    },
};
