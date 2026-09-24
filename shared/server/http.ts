import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { idSchema } from '@/shared/lib/validation/ids';

export class ApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
        readonly headers?: Record<string, string>,
    ) {
        super(message);
    }
}

export const badRequest = (message = 'Bad request.') => new ApiError(400, message);
export const unauthorized = (message = 'Unauthorized.') => new ApiError(401, message);
export const forbidden = (message = 'Forbidden.') => new ApiError(403, message);
export const notFound = (message = 'Not found.') => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);

export function json<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function noContent() {
    return new NextResponse(null, { status: 204 });
}

export function errorResponse(error: ApiError) {
    return NextResponse.json(
        { message: error.message },
        { status: error.status, headers: error.headers },
    );
}

type RouteContext<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, params: P) => Promise<Response>;

/**
 * Wraps a route handler: resolves params, maps ApiError to its response and
 * turns anything unexpected into a logged 500.
 */
export function route<P = Record<string, never>>(handler: Handler<P>) {
    return async (req: NextRequest, context: RouteContext<P>) => {
        try {
            return await handler(req, await context.params);
        } catch (error) {
            if (error instanceof ApiError) return errorResponse(error);

            console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, error);
            return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
        }
    };
}

function firstIssue(error: z.ZodError) {
    const issue = error.issues[0];
    if (!issue) return 'Invalid input.';

    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
}

export function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
    const result = schema.safeParse(value);
    if (!result.success) throw badRequest(firstIssue(result.error));
    return result.data;
}

export async function readBody<S extends z.ZodType>(req: NextRequest, schema: S) {
    let body: unknown;

    try {
        body = await req.json();
    } catch {
        throw badRequest('Invalid JSON body.');
    }

    return parse(schema, body);
}

export function readQuery<S extends z.ZodType>(req: NextRequest, schema: S) {
    return parse(schema, Object.fromEntries(req.nextUrl.searchParams));
}

export function parseId(value: string, name = 'id') {
    const result = idSchema.safeParse(value);
    if (!result.success) throw badRequest(`Invalid ${name}.`);
    return result.data;
}
