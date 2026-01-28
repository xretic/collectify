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
    { method: 'GET', pattern: /^\/api\/notifications\/?$/ },
    { method: 'POST', pattern: /^\/api\/notifications\/?$/ },
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const { method } = request;

    const isProtected = protectedRoutes.some(
        (rule) => rule.method === method && rule.pattern.test(pathname),
    );

    if (isProtected) {
        const valid = await isSessionValid(request);

        if (!valid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
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

    if (!session) return false;

    return true;
}

export const config = {
    matcher: [
        '/api/users/:path*',
        '/api/collections/:path*',
        '/api/auth/:path*',
        '/api/notifications/:path*',
    ],
};
