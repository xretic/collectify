import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Rule = {
    method: string;
    pattern: RegExp;
};

const protectedRoutes: Rule[] = [
    { method: 'PATCH', pattern: /^\/api\/users\/[^/]+$/ },
    { method: 'PATCH', pattern: /^\/api\/collections\/[^/]+$/ },
    { method: 'GET', pattern: /^\/api\/users\/search\/[^/]+$/ },
    { method: 'POST', pattern: /^\/api\/auth\/logout$/ },
    { method: 'GET', pattern: /^\/api\/auth\/me$/ },
    { method: 'DELETE', pattern: /^\/api\/users$/ },
    { method: 'GET', pattern: /^\/api\/notifications\/?$/ },
    { method: 'POST', pattern: /^\/api\/notifications\/?$/ },
];

const publicPages: RegExp[] = [/^\/$/, /^\/users\/[^/]+$/, /^\/collections\/[^/]+$/];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const { method } = request;

    const sessionId = request.cookies.get('sessionId')?.value;
    const isApiProtected = protectedRoutes.some(
        (rule) => rule.method === method && rule.pattern.test(pathname),
    );

    if (pathname.startsWith('/api') && isApiProtected) {
        const valid = await isSessionValid(request);

        if (!valid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
    }
    const isPublicPage = publicPages.some((x) => x.test(pathname));

    if (!pathname.startsWith('/api') && !isPublicPage && !sessionId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

async function isSessionValid(request: NextRequest): Promise<boolean> {
    const sessionId = request.cookies.get('sessionId')?.value;
    if (!sessionId) return false;

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    return !!session;
}

export const config = {
    matcher: [
        '/api/users/:path*',
        '/api/collections/:path*',
        '/api/auth/:path*',
        '/api/notifications/:path*',
        '/users/:path*',
        '/collections/:path*',
        '/notifications',
        '/settings',
        '/',
    ],
};
