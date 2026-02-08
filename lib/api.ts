import ky from 'ky';

export const api = ky.create({
    credentials: 'include',
    prefixUrl: '/',
});
