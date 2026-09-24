import ky from 'ky';

/** Browser client for the app's own API (same origin, cookies included). */
export const api = ky.create({
    credentials: 'include',
    prefixUrl: '/api',
    retry: 0,
});
