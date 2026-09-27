import { Suspense } from 'react';
import { cookies } from 'next/headers';
import HomePage from '@/views/home/ui/HomePage';
import { SESSION_COOKIE } from '@/entities/session/server/session';

export default async function HomeRoute() {
    // Guests (no session cookie) get the landing rendered on the server, without waiting for /me.
    const hasSession = (await cookies()).has(SESSION_COOKIE);

    return (
        <Suspense>
            <HomePage hasSession={hasSession} />
        </Suspense>
    );
}
