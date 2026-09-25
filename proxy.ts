import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'sessionId';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Pages that need a signed-in user. Real authorization happens in the API. */
const PRIVATE_PAGES = [
    /^\/users\/me$/,
    /^\/collections\/(create|my)$/,
    /^\/notifications$/,
    /^\/settings$/,
    /^\/chats(\/.*)?$/,
    /^\/management$/,
    /^\/onboarding$/,
];

function isCrossSite(req: NextRequest) {
    const origin = req.headers.get('origin');
    if (!origin) return false;

    try {
        return new URL(origin).host !== req.headers.get('host');
    } catch {
        return true;
    }
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith('/api/')) {
        // Defense in depth on top of SameSite=Lax cookies.
        if (MUTATING_METHODS.has(req.method) && isCrossSite(req)) {
            return NextResponse.json({ message: 'Cross-site request blocked.' }, { status: 403 });
        }

        return NextResponse.next();
    }

    const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

    if (!hasSession && PRIVATE_PAGES.some((page) => page.test(pathname))) {
        const login = new URL('/auth/login', req.url);
        login.searchParams.set('next', pathname);
        return NextResponse.redirect(login);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|icon.svg|fonts/|.*\\.(?:png|jpg|svg|ico)$).*)',
    ],
};
