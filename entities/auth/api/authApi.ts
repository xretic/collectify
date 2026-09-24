import { api } from '@/shared/api/api';
import type { SessionUser } from '@/entities/user/model/types';

type UserResponse = { user: SessionUser };

export const authApi = {
    async me() {
        return (await api.get('auth/me').json<UserResponse>()).user;
    },

    async login(payload: { email: string; password: string }) {
        return (await api.post('auth/login', { json: payload }).json<UserResponse>()).user;
    },

    async register(payload: { email: string; username: string; password: string }) {
        return (await api.post('auth/register', { json: payload }).json<UserResponse>()).user;
    },

    async logout() {
        await api.post('auth/logout');
    },

    async stopImpersonation() {
        return (await api.post('auth/impersonation/stop').json<UserResponse>()).user;
    },

    /** Full-page redirect: the server sets the CSRF `state` cookie and forwards to the provider. */
    oauthUrl(provider: 'google' | 'github') {
        return `/api/auth/oauth/${provider}`;
    },
};
