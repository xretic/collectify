import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { idSchema } from '@/shared/lib/validation/ids';
import { isValidationKey, VALIDATION_VALUES } from '@/shared/lib/validation/messages';
import type { LooseTranslator, Messages, TranslationValues } from '@/shared/i18n/types';

export type ErrorKey = keyof Messages['errors'];

/** Carries a translation key; the response message is translated to the viewer's language. */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        /** `errors.*` key, or a `validation.*` key from a schema issue. */
        readonly key: string,
        readonly values?: TranslationValues,
        readonly headers?: Record<string, string>,
    ) {
        super(key);
    }
}

export const apiError = (
    status: number,
    key: ErrorKey,
    values?: TranslationValues,
    headers?: Record<string, string>,
) => new ApiError(status, `errors.${key}`, values, headers);

export const badRequest = (key: ErrorKey = 'badRequest', values?: TranslationValues) =>
    apiError(400, key, values);
export const unauthorized = (key: ErrorKey = 'unauthorized') => apiError(401, key);
export const forbidden = (key: ErrorKey = 'forbidden', values?: TranslationValues) =>
    apiError(403, key, values);
export const notFound = (key: ErrorKey = 'notFound') => apiError(404, key);
export const conflict = (key: ErrorKey) => apiError(409, key);

export function json<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function noContent() {
    return new NextResponse(null, { status: 204 });
}

async function translate(key: string, values?: TranslationValues) {
    const t = (await getTranslations()) as unknown as LooseTranslator;
    return t.has(key) ? t(key, { ...VALIDATION_VALUES, ...values }) : key;
}

export async function errorResponse(error: ApiError) {
    return NextResponse.json(
        { message: await translate(error.key, error.values) },
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
            return NextResponse.json(
                { message: await translate('errors.internal') },
                { status: 500 },
            );
        }
    };
}

function firstIssue(error: z.ZodError) {
    const issue = error.issues[0];
    if (!issue) return badRequest('invalidInput');
    if (isValidationKey(issue.message)) return new ApiError(400, issue.message);

    const field = issue.path.join('.');
    return field ? badRequest('invalidField', { field }) : badRequest('invalidInput');
}

export function parse<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
    const result = schema.safeParse(value);
    if (!result.success) throw firstIssue(result.error);
    return result.data;
}

export async function readBody<S extends z.ZodType>(req: NextRequest, schema: S) {
    let body: unknown;

    try {
        body = await req.json();
    } catch {
        throw badRequest('invalidJson');
    }

    return parse(schema, body);
}

export function readQuery<S extends z.ZodType>(req: NextRequest, schema: S) {
    return parse(schema, Object.fromEntries(req.nextUrl.searchParams));
}

export function parseId(value: string) {
    const result = idSchema.safeParse(value);
    if (!result.success) throw badRequest('invalidId');
    return result.data;
}
