import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type RouteRule = {
    pattern: RegExp;
    methods: string[];
};

function compilePath(path: string): RegExp {
    const regex = path.replace(/:[^/]+/g, '[^/]+').replace(/\//g, '\\/');

    return new RegExp(`^${regex}$`);
}

function createRule(path: string, methods: string[]): RouteRule {
    return {
        pattern: compilePath(path),
        methods,
    };
}

const protectedRoutes: RouteRule[] = [
    createRule('/api/collections/:id/action', ['PATCH']),
    createRule('/api/collections/:id/items', ['POST', 'DELETE']),
    createRule('/api/comments/:id', ['DELETE', 'PATCH']),
    createRule('/api/chats/:id', ['POST', 'GET', 'PATCH']),
    createRule('/api/chats/:id/existence', ['GET']),
    createRule('/api/chats/:id/create', ['POST']),
    createRule('/api/collections/:id/order', ['PATCH']),
    createRule('/api/collections/:id/comment', ['POST']),
    createRule('api/collection/:id/edit', ['PATCH']),
    createRule('/api/collections/:id/delete', ['DELETE']),
    createRule('/api/collections', ['POST']),
    createRule('/api/users/search/:query', ['GET']),
    createRule('/api/users/auth', ['PATCH']),
    createRule('/api/users', ['DELETE', 'PATCH']),
    createRule('/api/auth/logout', ['POST']),
    createRule('/api/auth/me', ['GET']),
    createRule('/api/notifications', ['GET', 'PATCH']),
];

function isProtected(pathname: string, method: string): boolean {
    return protectedRoutes.some(
        (rule) => rule.methods.includes(method) && rule.pattern.test(pathname),
    );
}

const publicPages: RegExp[] = [/^\/$/, /^\/users\/[^/]+$/, /^\/collections\/(?!create$)[^/]+$/];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const { method } = request;

    const sessionId = request.cookies.get('sessionId')?.value;
    const isApiProtected = isProtected(pathname, method);

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

    if (!session || session.expiresAt < new Date()) {
        return false;
    }

    return true;
}

export const config = {
    matcher: [
        '/api/users/:path*',
        '/api/collections/:path*',
        '/api/auth/:path*',
        '/api/notifications/:path*',
        '/api/chats/:path*',
        '/api/comments/:path*',
        '/users/:path*',
        '/collections/:path*',
        '/notifications',
        '/settings',
        '/chats',
        '/',
    ],
};
