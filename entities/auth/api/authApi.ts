import { api } from '@/shared/api/api';
import { SessionUserInResponse } from '@/types/UserInResponse';

type LoginPayload = {
    email: string;
    password: string;
};

type RegisterPayload = {
    email: string;
    password: string;
    username: string;
};

export const authApi = {
    login(payload: LoginPayload) {
        return api.post('api/auth/login', {
            json: payload,
            throwHttpErrors: false,
        });
    },

    register(payload: RegisterPayload) {
        return api.post('api/auth/register', {
            json: payload,
            throwHttpErrors: false,
        });
    },

    async getMe() {
        const data = await api.get('api/auth/me').json<{ user: SessionUserInResponse }>();
        return data.user ?? null;
    },

    logout() {
        return api.post('api/auth/logout');
    },

    stopImpersonation() {
        return api.post('api/auth/impersonation/stop').json<{ user: SessionUserInResponse }>();
    },
};
