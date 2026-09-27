import { api } from '@/shared/api/api';
import type { SessionUser } from '@/entities/user/model/types';
import type { Locale } from '@/shared/config/i18n';

type UserResponse = { user: SessionUser };

export const authApi = {
    async me() {
        return (await api.get('auth/me').json<UserResponse>()).user;
    },

    async login(payload: { email: string; password: string }) {
        return (await api.post('auth/login', { json: payload }).json<UserResponse>()).user;
    },

    async register(payload: { email: string; username: string; password: string; locale: Locale }) {
        return (await api.post('auth/register', { json: payload }).json<UserResponse>()).user;
    },

    /** Always succeeds for a well-formed address, so it does not reveal who has an account. */
    async forgotPassword(email: string) {
        await api.post('auth/password/forgot', { json: { email } });
    },

    /** Sets a new password from an emailed link and signs in. */
    async resetPassword(payload: { token: string; password: string; confirmPassword: string }) {
        return (await api.post('auth/password/reset', { json: payload }).json<UserResponse>()).user;
    },

    async verifyEmail(token: string) {
        await api.post('auth/email/verify', { json: { token } });
    },

    /** `false` when there is nothing to confirm any more. */
    async resendVerification() {
        return (await api.post('auth/email/verification').json<{ sent: boolean }>()).sent;
    },

    /** Sets the language cookie (and the account language when signed in). */
    async setLocale(locale: Locale) {
        await api.put('locale', { json: { locale } });
    },

    async logout() {
        await api.post('auth/logout');
    },

    async stopImpersonation() {
        return (await api.post('auth/impersonation/stop').json<UserResponse>()).user;
    },

    /**
     * Full-page redirect: the server sets the CSRF `state` cookie and forwards to
     * the provider; afterwards the user lands on `next`.
     */
    oauthUrl(provider: 'google' | 'github', next?: string) {
        const query = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : '';
        return `/api/auth/oauth/${provider}${query}`;
    },
};
